// Todoist-style filter query engine: tokenize -> parse to AST -> compile to a
// predicate evaluated against TaskDTOs in JS.
//
// Supported: today, tomorrow, overdue, "no date"/"no due date", "recurring",
// "no labels", "N days"/"next N days", p1..p4, #Project, @label, free text,
// and the operators & (and), | or , (or), ! (not), and parentheses.

import { startOfDay, differenceInCalendarDays } from "date-fns";
import type { TaskDTO } from "@/lib/types";

type Node =
  | { type: "term"; value: string }
  | { type: "not"; child: Node }
  | { type: "and"; left: Node; right: Node }
  | { type: "or"; left: Node; right: Node };

type Token =
  | { t: "op"; v: "&" | "|" | "!" | "(" | ")" }
  | { t: "term"; v: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buf = "";
  const flush = () => {
    const term = buf.trim();
    if (term) tokens.push({ t: "term", v: term });
    buf = "";
  };
  for (const ch of input) {
    if (ch === "&" || ch === "|" || ch === "(" || ch === ")" || ch === "!" || ch === ",") {
      flush();
      tokens.push({ t: "op", v: ch === "," ? "|" : (ch as "&" | "|" | "!" | "(" | ")") });
    } else {
      buf += ch;
    }
  }
  flush();
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }
  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parse(): Node | null {
    if (this.tokens.length === 0) return null;
    return this.parseOr();
  }

  private parseOr(): Node {
    let left = this.parseAnd();
    while (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "|") {
      this.next();
      left = { type: "or", left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Node {
    let left = this.parseNot();
    while (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "&") {
      this.next();
      left = { type: "and", left, right: this.parseNot() };
    }
    return left;
  }

  private parseNot(): Node {
    if (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "!") {
      this.next();
      return { type: "not", child: this.parseNot() };
    }
    return this.parseAtom();
  }

  private parseAtom(): Node {
    const tok = this.next();
    if (!tok) return { type: "term", value: "" };
    if (tok.t === "op" && tok.v === "(") {
      const inner = this.parseOr();
      if (this.peek()?.t === "op" && (this.peek() as { v: string }).v === ")") this.next();
      return inner;
    }
    if (tok.t === "term") return { type: "term", value: tok.v };
    return { type: "term", value: "" };
  }
}

export type FilterContext = {
  now: Date;
  projectsById: Map<string, { name: string }>;
};

function dueDate(task: TaskDTO): Date | null {
  const iso = task.dueDatetime ?? task.dueDate;
  return iso ? new Date(iso) : null;
}

function matchTerm(term: string, task: TaskDTO, ctx: FilterContext): boolean {
  const t = term.trim().toLowerCase();
  const due = dueDate(task);

  // Date terms compare against ctx.now (deterministic — not the wall clock).
  const dayDiff = due ? differenceInCalendarDays(startOfDay(due), startOfDay(ctx.now)) : null;
  if (t === "today") return dayDiff === 0;
  if (t === "tomorrow") return dayDiff === 1;
  if (t === "overdue" || t === "over due") return dayDiff !== null && dayDiff < 0;
  if (t === "no date" || t === "no due date" || t === "nodate") return !due;
  if (t === "recurring") return task.isRecurring;
  if (t === "no labels" || t === "no label") return task.labels.length === 0;

  const daysMatch = t.match(/^(?:next\s+)?(\d+)\s+days?$/);
  if (daysMatch) {
    if (!due) return false;
    const diff = differenceInCalendarDays(startOfDay(due), startOfDay(ctx.now));
    return diff >= 0 && diff <= parseInt(daysMatch[1], 10);
  }

  const prio = t.match(/^p([1-4])$/);
  if (prio) return task.priority === parseInt(prio[1], 10);

  if (term.startsWith("#")) {
    const name = term.slice(1).toLowerCase();
    const project = ctx.projectsById.get(task.projectId);
    return !!project && project.name.toLowerCase() === name;
  }

  if (term.startsWith("@")) {
    const name = term.slice(1).toLowerCase();
    return task.labels.some((l) => l.name.toLowerCase() === name);
  }

  // Free text → search content/description.
  if (!t) return true;
  const text = (task.content + " " + task.description).toLowerCase();
  return text.includes(t.replace(/^search:\s*/, ""));
}

function evalNode(node: Node, task: TaskDTO, ctx: FilterContext): boolean {
  switch (node.type) {
    case "term":
      return matchTerm(node.value, task, ctx);
    case "not":
      return !evalNode(node.child, task, ctx);
    case "and":
      return evalNode(node.left, task, ctx) && evalNode(node.right, task, ctx);
    case "or":
      return evalNode(node.left, task, ctx) || evalNode(node.right, task, ctx);
  }
}

/** Compile a filter query into a predicate. Empty/invalid queries match nothing. */
export function compileFilter(query: string): (task: TaskDTO, ctx: FilterContext) => boolean {
  const ast = new Parser(tokenize(query)).parse();
  if (!ast) return () => false;
  return (task, ctx) => evalNode(ast, task, ctx);
}

export function evaluateFilter(
  query: string,
  tasks: TaskDTO[],
  ctx: FilterContext,
): TaskDTO[] {
  const pred = compileFilter(query);
  return tasks.filter((task) => pred(task, ctx));
}
