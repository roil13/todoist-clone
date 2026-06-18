import { describe, it, expect } from "vitest";
import { parseRecurrence, nextOccurrence, firstOccurrence } from "./index";

describe("parseRecurrence", () => {
  it("parses simple frequencies", () => {
    expect(parseRecurrence("every day")?.rule).toBe("FREQ=DAILY");
    expect(parseRecurrence("every week")?.rule).toBe("FREQ=WEEKLY");
    expect(parseRecurrence("every month")?.rule).toBe("FREQ=MONTHLY");
    expect(parseRecurrence("daily")?.rule).toBe("FREQ=DAILY");
  });

  it("parses intervals", () => {
    expect(parseRecurrence("every 3 weeks")?.rule).toBe("FREQ=WEEKLY;INTERVAL=3");
    expect(parseRecurrence("every 2 days")?.rule).toBe("FREQ=DAILY;INTERVAL=2");
  });

  it("parses weekday and weekdays", () => {
    expect(parseRecurrence("every monday")?.rule).toBe("FREQ=WEEKLY;BYDAY=MO");
    expect(parseRecurrence("every weekday")?.rule).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
  });

  it("returns null for non-recurrence text", () => {
    expect(parseRecurrence("buy milk tomorrow")).toBeNull();
  });

  it("parses Hebrew frequencies", () => {
    expect(parseRecurrence("כל יום")?.rule).toBe("FREQ=DAILY");
    expect(parseRecurrence("כל שבוע")?.rule).toBe("FREQ=WEEKLY");
    expect(parseRecurrence("כל חודש")?.rule).toBe("FREQ=MONTHLY");
    expect(parseRecurrence("כל שנה")?.rule).toBe("FREQ=YEARLY");
  });

  it("parses Hebrew weekdays and weekday-set", () => {
    expect(parseRecurrence("כל שני")?.rule).toBe("FREQ=WEEKLY;BYDAY=MO");
    expect(parseRecurrence("כל יום חמישי")?.rule).toBe("FREQ=WEEKLY;BYDAY=TH");
    expect(parseRecurrence("ימי חול")?.rule).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
  });

  it("parses Hebrew intervals", () => {
    expect(parseRecurrence("כל יומיים")?.rule).toBe("FREQ=DAILY;INTERVAL=2");
    expect(parseRecurrence("כל 3 שבועות")?.rule).toBe("FREQ=WEEKLY;INTERVAL=3");
  });
});

describe("nextOccurrence", () => {
  it("advances a daily task by one day", () => {
    const cur = new Date("2026-06-15T00:00:00Z");
    const next = nextOccurrence("FREQ=DAILY", cur);
    expect(next.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-06-16");
  });

  it("advances weekly-by-weekday to the next matching day", () => {
    const cur = new Date("2026-06-15T00:00:00Z"); // Monday
    const next = nextOccurrence("FREQ=WEEKLY;BYDAY=MO", cur);
    expect(next.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-06-22");
  });
});

describe("firstOccurrence", () => {
  it("returns the first matching day on or after the reference", () => {
    const from = new Date("2026-06-15T00:00:00Z"); // Monday
    const first = firstOccurrence("FREQ=WEEKLY;BYDAY=FR", from);
    expect(first?.toISOString().slice(0, 10)).toBe("2026-06-19");
  });
});
