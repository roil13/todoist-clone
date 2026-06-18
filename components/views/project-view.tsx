"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, MoreHorizontal, List, LayoutGrid, CalendarDays } from "lucide-react";
import { useTasks } from "@/lib/hooks/tasks";
import { useProjects, useUpdateProject } from "@/lib/hooks/projects";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from "@/lib/hooks/sections";
import { TaskList } from "@/components/task/task-list";
import { SmartQuickAdd } from "@/components/task/smart-quick-add";
import { ColorDot } from "@/components/ui/color-picker";
import { ProjectBoard } from "./project-board";
import { ProjectCalendar } from "./project-calendar";
import { useT } from "@/lib/i18n";
import type { TaskDTO, SectionDTO, ProjectDTO } from "@/lib/types";

type ViewType = ProjectDTO["defaultView"];

function ViewSwitcher({ value, onChange }: { value: ViewType; onChange: (v: ViewType) => void }) {
  const t = useT();
  const opts: { v: ViewType; icon: React.ReactNode; label: string }[] = [
    { v: "LIST", icon: <List size={15} />, label: t("view.list") },
    { v: "BOARD", icon: <LayoutGrid size={15} />, label: t("view.board") },
    { v: "CALENDAR", icon: <CalendarDays size={15} />, label: t("view.calendar") },
  ];
  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5 text-sm">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex items-center gap-1 rounded px-2 py-1 ${value === o.v ? "bg-bg-active text-accent" : "text-text-muted hover:bg-bg-hover"}`}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionAdder({ projectId }: { projectId: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateSection();
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex items-center gap-1 text-sm text-text-muted hover:text-accent"
      >
        <Plus size={14} /> {t("section.add")}
      </button>
    );
  return (
    <div className="mt-4 flex gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) {
            create.mutate({ name: name.trim(), projectId });
            setName("");
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={t("section.name")}
        className="flex-1 rounded-md border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <button
        onClick={() => {
          if (name.trim()) create.mutate({ name: name.trim(), projectId });
          setName("");
          setOpen(false);
        }}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white"
      >
        {t("common.add")}
      </button>
    </div>
  );
}

function SectionBlock({
  section,
  tasks,
  projectId,
}: {
  section: SectionDTO;
  tasks: TaskDTO[];
  projectId: string;
}) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState(false);
  const update = useUpdateSection(projectId);
  const del = useDeleteSection(projectId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);

  return (
    <section className="mt-5">
      <div className="group/section mb-1 flex items-center gap-2 border-b border-border pb-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              update.mutate({ id: section.id, name: name.trim() || section.name });
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="flex-1 rounded border border-border bg-bg px-1 text-sm font-semibold outline-none"
          />
        ) : (
          <h2 className="flex-1 cursor-text text-sm font-semibold" onClick={() => setEditing(true)}>
            {section.name}{" "}
            <span className="text-text-faint">{tasks.length || ""}</span>
          </h2>
        )}
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-hover group-hover/section:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div className="absolute end-0 z-10 mt-1 w-36 rounded-md border border-border bg-bg-elevated py-1 text-sm shadow-lg">
              <button
                onClick={() => {
                  setEditing(true);
                  setMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover"
              >
                {t("section.rename")}
              </button>
              <button
                onClick={() => del.mutate(section.id)}
                className="block w-full px-3 py-1.5 text-start text-[#d1453b] hover:bg-bg-hover"
              >
                {t("section.delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      <TaskList tasks={tasks} />

      {adding ? (
        <div className="mt-2">
          <SmartQuickAdd
            projectId={projectId}
            sectionId={section.id}
            onDone={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 flex items-center gap-1 text-sm text-text-muted hover:text-accent"
        >
          <Plus size={14} className="text-accent" /> {t("view.addTask")}
        </button>
      )}
    </section>
  );
}

export function ProjectView({ projectId }: { projectId: string }) {
  const t = useT();
  const { data: projects } = useProjects();
  const { data: tasks, isLoading } = useTasks({ projectId, parentId: null });
  const { data: sections } = useSections(projectId);
  const updateProject = useUpdateProject();
  const [addingTop, setAddingTop] = useState(false);

  const project = projects?.find((p) => p.id === projectId);
  const [view, setView] = useState<ViewType>("LIST");
  useEffect(() => {
    if (project) setView(project.defaultView);
  }, [project?.id, project?.defaultView]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeView(v: ViewType) {
    setView(v);
    if (project && !project.isInbox) updateProject.mutate({ id: project.id, defaultView: v });
  }

  const { noSection, bySection } = useMemo(() => {
    const noSection: TaskDTO[] = [];
    const bySection = new Map<string, TaskDTO[]>();
    (tasks ?? []).forEach((t) => {
      if (!t.sectionId) noSection.push(t);
      else {
        if (!bySection.has(t.sectionId)) bySection.set(t.sectionId, []);
        bySection.get(t.sectionId)!.push(t);
      }
    });
    return { noSection, bySection };
  }, [tasks]);

  const header = (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        {project && !project.isInbox && <ColorDot color={project.color} size={12} />}
        {project?.isInbox ? t("nav.inbox") : (project?.name ?? "")}
      </h1>
      {project && !project.isInbox && <ViewSwitcher value={view} onChange={changeView} />}
    </div>
  );

  if (view === "BOARD") {
    return (
      <div className="py-6">
        <div className="px-4 md:px-8">{header}</div>
        <ProjectBoard projectId={projectId} />
      </div>
    );
  }
  if (view === "CALENDAR") {
    return (
      <div className="py-6">
        <div className="px-4 md:px-8">{header}</div>
        <ProjectCalendar projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      {header}

      {isLoading ? (
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      ) : (
        <>
          <TaskList tasks={noSection} />
          {addingTop ? (
            <div className="mt-2">
              <SmartQuickAdd projectId={projectId} onDone={() => setAddingTop(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAddingTop(true)}
              className="mt-1 flex items-center gap-1 text-sm text-text-muted hover:text-accent"
            >
              <Plus size={14} className="text-accent" /> {t("view.addTask")}
            </button>
          )}

          {(sections ?? []).map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              projectId={projectId}
              tasks={bySection.get(s.id) ?? []}
            />
          ))}

          <SectionAdder projectId={projectId} />
        </>
      )}
    </div>
  );
}
