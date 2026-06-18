import { describe, it, expect } from "vitest";
import { parseQuickAdd } from "./parser";

const REF = new Date("2026-06-15T12:00:00Z"); // a Monday

describe("parseQuickAdd", () => {
  it("extracts priority, project, and labels, leaving clean content", () => {
    const r = parseQuickAdd("Submit report #Work @urgent @home p1", REF);
    expect(r.content).toBe("Submit report");
    expect(r.priority).toBe(1);
    expect(r.projectName).toBe("Work");
    expect(r.labelNames).toEqual(["urgent", "home"]);
  });

  it("parses a natural-language date with time", () => {
    const r = parseQuickAdd("Call dentist tomorrow at 5pm", REF);
    expect(r.content).toBe("Call dentist");
    expect(r.dueDatetime).not.toBeNull();
    expect(new Date(r.dueDatetime!).getUTCDate()).toBe(16);
  });

  it("parses date-only without a time", () => {
    const r = parseQuickAdd("Pay rent tomorrow", REF);
    expect(r.dueDate).not.toBeNull();
    expect(r.dueDatetime).toBeNull();
  });

  it("detects recurrence and sets a first occurrence", () => {
    const r = parseQuickAdd("Standup every weekday", REF);
    expect(r.content).toBe("Standup");
    expect(r.recurrenceRule).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
    expect(r.dueDate).not.toBeNull();
  });

  it("supports !!2 priority syntax", () => {
    const r = parseQuickAdd("Important thing !!2", REF);
    expect(r.priority).toBe(2);
    expect(r.content).toBe("Important thing");
  });

  it("defaults to priority 4 and no date", () => {
    const r = parseQuickAdd("Just a task", REF);
    expect(r.priority).toBe(4);
    expect(r.dueDate).toBeNull();
    expect(r.projectName).toBeNull();
    expect(r.labelNames).toEqual([]);
  });

  it("parses Hebrew date words, tokens, and time", () => {
    const r = parseQuickAdd("דוח מחר 17:00 #עבודה @דחוף p1", REF);
    expect(r.content).toBe("דוח");
    expect(r.priority).toBe(1);
    expect(r.projectName).toBe("עבודה");
    expect(r.labelNames).toEqual(["דחוף"]);
    expect(r.dueDate?.slice(0, 10)).toBe("2026-06-16");
    expect(r.dueDatetime).not.toBeNull();
  });

  it("parses Hebrew recurrence in quick add", () => {
    const r = parseQuickAdd("משימה כל יום", REF);
    expect(r.content).toBe("משימה");
    expect(r.recurrenceRule).toBe("FREQ=DAILY");
    expect(r.dueDate).not.toBeNull();
  });

  it("parses Hebrew היום (today)", () => {
    const r = parseQuickAdd("לשלם היום", REF);
    expect(r.content).toBe("לשלם");
    expect(r.dueDate?.slice(0, 10)).toBe("2026-06-15");
  });
});
