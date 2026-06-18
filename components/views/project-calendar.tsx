"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasks, useUpdateTask } from "@/lib/hooks/tasks";
import { useT, useLocale } from "@/lib/i18n";
import { dateFnsLocale } from "@/lib/i18n/config";
import type { TaskDTO } from "@/lib/types";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toUTCDateISO(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

function TaskChip({ task }: { task: TaskDTO }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`mb-1 cursor-grab truncate rounded px-1 py-0.5 text-[11px] prio-${task.priority} bg-bg-hover`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      title={task.content}
    >
      {task.content}
      {task.duration ? <span className="text-text-faint"> · {task.duration}{task.durationUnit === "minute" ? "m" : "d"}</span> : null}
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  tasks,
}: {
  date: Date;
  inMonth: boolean;
  tasks: TaskDTO[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(date) });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 border border-border p-1 ${inMonth ? "" : "bg-bg-sidebar opacity-60"} ${isOver ? "bg-bg-active" : ""}`}
    >
      <div className={`mb-1 text-end text-xs ${isToday(date) ? "font-bold text-accent" : "text-text-muted"}`}>
        {format(date, "d")}
      </div>
      {tasks.map((t) => (
        <TaskChip key={t.id} task={t} />
      ))}
    </div>
  );
}

export function ProjectCalendar({ projectId }: { projectId?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const dl = dateFnsLocale(locale);
  const { data: tasks } = useTasks(projectId ? { projectId } : {});
  const update = useUpdateTask();
  const [cursor, setCursor] = useState(new Date());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return list;
  }, [cursor]);

  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEEEEE", { locale: dl }));
  }, [dl]);

  const byDay = useMemo(() => {
    const map = new Map<string, TaskDTO[]>();
    (tasks ?? []).forEach((t) => {
      const iso = t.dueDate ?? t.dueDatetime;
      if (!iso) return;
      const key = new Date(iso).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [tasks]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const targetISO = new Date(String(over.id) + "T00:00:00Z").toISOString();
    update.mutate({ id: taskId, dueDate: targetISO, dueDatetime: null });
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold">{format(cursor, "MMMM yyyy", { locale: dl })}</h2>
        <button onClick={() => setCursor((c) => addMonths(c, -1))} className="rounded p-1 hover:bg-bg-hover"><ChevronLeft size={18} className="rtl:-scale-x-100" /></button>
        <button onClick={() => setCursor((c) => addMonths(c, 1))} className="rounded p-1 hover:bg-bg-hover"><ChevronRight size={18} className="rtl:-scale-x-100" /></button>
        <button onClick={() => setCursor(new Date())} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-bg-hover">{t("nav.today")}</button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-7 text-xs font-semibold text-text-muted">
          {weekdays.map((d, i) => (
            <div key={i} className="px-1 pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => (
            <DayCell key={d.toISOString()} date={d} inMonth={isSameMonth(d, cursor)} tasks={byDay.get(dayKey(d)) ?? []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
