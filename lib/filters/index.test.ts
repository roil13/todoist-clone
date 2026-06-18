import { describe, it, expect } from "vitest";
import { evaluateFilter, type FilterContext } from "./index";
import type { TaskDTO } from "@/lib/types";

const NOW = new Date("2026-06-15T12:00:00Z");

function task(partial: Partial<TaskDTO>): TaskDTO {
  return {
    id: Math.random().toString(36),
    content: "task",
    description: "",
    projectId: "p_work",
    sectionId: null,
    parentId: null,
    priority: 4,
    order: 0,
    dueDate: null,
    dueDatetime: null,
    dueString: null,
    recurrenceRule: null,
    isRecurring: false,
    duration: null,
    durationUnit: null,
    isCompleted: false,
    completedAt: null,
    createdAt: NOW.toISOString(),
    labels: [],
    subtaskCount: 0,
    commentCount: 0,
    ...partial,
  };
}

const ctx: FilterContext = {
  now: NOW,
  projectsById: new Map([
    ["p_work", { name: "Work" }],
    ["p_home", { name: "Home" }],
  ]),
};

const tasks: TaskDTO[] = [
  task({ content: "today p1", dueDate: "2026-06-15T00:00:00Z", priority: 1 }),
  task({ content: "overdue", dueDate: "2026-06-10T00:00:00Z" }),
  task({ content: "tomorrow home", dueDate: "2026-06-16T00:00:00Z", projectId: "p_home" }),
  task({ content: "no date urgent", labels: [{ id: "l1", name: "urgent", color: "red", order: 0, isFavorite: false }] }),
  task({ content: "next week", dueDate: "2026-06-20T00:00:00Z" }),
];

describe("evaluateFilter", () => {
  it("filters today", () => {
    expect(evaluateFilter("today", tasks, ctx).map((t) => t.content)).toEqual(["today p1"]);
  });

  it("filters overdue", () => {
    expect(evaluateFilter("overdue", tasks, ctx).map((t) => t.content)).toEqual(["overdue"]);
  });

  it("AND of priority and today", () => {
    expect(evaluateFilter("today & p1", tasks, ctx).map((t) => t.content)).toEqual(["today p1"]);
  });

  it("OR with comma", () => {
    const res = evaluateFilter("today, tomorrow", tasks, ctx).map((t) => t.content).sort();
    expect(res).toEqual(["today p1", "tomorrow home"]);
  });

  it("project and label tokens", () => {
    expect(evaluateFilter("#Home", tasks, ctx).map((t) => t.content)).toEqual(["tomorrow home"]);
    expect(evaluateFilter("@urgent", tasks, ctx).map((t) => t.content)).toEqual(["no date urgent"]);
  });

  it("no date and negation", () => {
    expect(evaluateFilter("no date", tasks, ctx).map((t) => t.content)).toEqual(["no date urgent"]);
    expect(evaluateFilter("!#Work", tasks, ctx).map((t) => t.content).sort()).toEqual(["tomorrow home"]);
  });

  it("N days window includes today..+N", () => {
    const res = evaluateFilter("7 days", tasks, ctx).map((t) => t.content).sort();
    expect(res).toEqual(["next week", "today p1", "tomorrow home"].sort());
  });
});
