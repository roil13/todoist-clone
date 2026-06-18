"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { duplicateProject } from "@/lib/local/repo";
import {
  CalendarDays,
  CalendarClock,
  Inbox as InboxIcon,
  Plus,
  Hash,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Filter as FilterIcon,
  Sun,
  Moon,
  MoreHorizontal,
  Star,
  TrendingUp,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useProjects, useUpdateProject, useDeleteProject } from "@/lib/hooks/projects";
import { useLabels, useDeleteLabel } from "@/lib/hooks/labels";
import { useFilters } from "@/lib/hooks/filters";
import { ColorDot } from "@/components/ui/color-picker";
import { ProjectDialog } from "./project-dialog";
import { LabelDialog } from "./label-dialog";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ProjectDTO, LabelDTO } from "@/lib/types";

function NavLink({
  href,
  icon,
  label,
  count,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        active ? "bg-bg-active font-medium text-accent" : "hover:bg-bg-hover",
      )}
    >
      <span className="text-text-muted">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count ? <span className="text-xs text-text-faint">{count}</span> : null}
    </Link>
  );
}

function ProjectRow({
  project,
  depth,
  onEdit,
  onAddSub,
  onNavigate,
}: {
  project: ProjectDTO;
  depth: number;
  onEdit: (p: ProjectDTO) => void;
  onAddSub: (parentId: string) => void;
  onNavigate?: () => void;
}) {
  const t = useT();
  const pathname = usePathname();
  const active = pathname === `/project?id=${project.id}`;
  const update = useUpdateProject();
  const del = useDeleteProject();
  const qc = useQueryClient();
  const [menu, setMenu] = useState(false);

  async function duplicate() {
    await duplicateProject(project.id);
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        active ? "bg-bg-active font-medium text-accent" : "hover:bg-bg-hover",
      )}
      style={{ paddingInlineStart: 8 + depth * 16 }}
    >
      <ColorDot color={project.color} />
      <Link href={`/project?id=${project.id}`} onClick={onNavigate} className="flex-1 truncate">
        {project.name}
      </Link>
      {project.isFavorite && <Star size={12} className="text-yellow-500" fill="currentColor" />}
      <div className="relative">
        <button
          onClick={() => setMenu((v) => !v)}
          className="rounded p-0.5 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100"
          aria-label={t("aria.projectOptions")}
        >
          <MoreHorizontal size={15} />
        </button>
        {menu && (
          <div
            className="absolute end-0 z-20 mt-1 w-40 rounded-md border border-border bg-bg-elevated py-1 text-sm shadow-lg"
            onMouseLeave={() => setMenu(false)}
          >
            <button onClick={() => { onEdit(project); setMenu(false); }} className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover">
              {t("project.edit")}
            </button>
            <button
              onClick={() => { update.mutate({ id: project.id, isFavorite: !project.isFavorite }); setMenu(false); }}
              className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover"
            >
              {project.isFavorite ? t("project.removeFavorite") : t("project.addToFavorites")}
            </button>
            <button onClick={() => { onAddSub(project.id); setMenu(false); }} className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover">
              {t("project.addSubproject")}
            </button>
            <button onClick={() => { duplicate(); setMenu(false); }} className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover">
              {t("project.duplicate")}
            </button>
            <button
              onClick={() => { update.mutate({ id: project.id, isArchived: true }); setMenu(false); }}
              className="block w-full px-3 py-1.5 text-start hover:bg-bg-hover"
            >
              {t("project.archive")}
            </button>
            <button
              onClick={() => { if (confirm(t("project.deleteConfirm", { name: project.name }))) del.mutate(project.id); setMenu(false); }}
              className="block w-full px-3 py-1.5 text-start text-[#d1453b] hover:bg-bg-hover"
            >
              {t("project.delete")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  userName,
  onNavigate,
}: {
  userName: string;
  onNavigate?: () => void;
}) {
  const t = useT();
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();
  const { data: filters } = useFilters();
  const delLabel = useDeleteLabel();

  const [projectDialog, setProjectDialog] = useState<{ open: boolean; project?: ProjectDTO; parentId?: string | null }>({ open: false });
  const [labelDialog, setLabelDialog] = useState<{ open: boolean; label?: LabelDTO }>({ open: false });
  const [showProjects, setShowProjects] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const userProjects = (projects ?? []).filter((p) => !p.isInbox);
  const inbox = (projects ?? []).find((p) => p.isInbox);
  const roots = userProjects.filter((p) => !p.parentId);
  const childrenOf = (id: string) => userProjects.filter((p) => p.parentId === id);
  const favProjects = userProjects.filter((p) => p.isFavorite);
  const favLabels = (labels ?? []).filter((l) => l.isFavorite);
  const favFilters = (filters ?? []).filter((f) => f.isFavorite);
  const hasFavorites = favProjects.length + favLabels.length + favFilters.length > 0;

  function renderTree(p: ProjectDTO, depth: number): React.ReactNode {
    return (
      <div key={p.id}>
        <ProjectRow
          project={p}
          depth={depth}
          onEdit={(proj) => setProjectDialog({ open: true, project: proj })}
          onAddSub={(parentId) => setProjectDialog({ open: true, parentId })}
          onNavigate={onNavigate}
        />
        {childrenOf(p.id).map((c) => renderTree(c, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 truncate text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="rounded p-1.5 text-text-muted hover:bg-bg-hover" aria-label={t("aria.toggleTheme")}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="px-2">
        <button
          onClick={() => window.dispatchEvent(new Event("open-quick-add"))}
          className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-accent hover:bg-bg-hover"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
            <Plus size={14} />
          </span>
          {t("nav.addTask")}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        <NavLink href="/today" icon={<CalendarDays size={17} />} label={t("nav.today")} onNavigate={onNavigate} />
        <NavLink href="/upcoming" icon={<CalendarClock size={17} />} label={t("nav.upcoming")} onNavigate={onNavigate} />
        <NavLink href={inbox ? `/project?id=${inbox.id}` : "/today"} icon={<InboxIcon size={17} />} label={t("nav.inbox")} onNavigate={onNavigate} />
        <NavLink href="/search" icon={<Search size={17} />} label={t("nav.search")} onNavigate={onNavigate} />
        <NavLink href="/filters" icon={<FilterIcon size={17} />} label={t("nav.filtersLabels")} onNavigate={onNavigate} />
        <NavLink href="/productivity" icon={<TrendingUp size={17} />} label={t("nav.productivity")} onNavigate={onNavigate} />
        <NavLink href="/activity" icon={<ActivityIcon size={17} />} label={t("nav.activity")} onNavigate={onNavigate} />
        <NavLink href="/settings" icon={<SettingsIcon size={17} />} label={t("nav.settings")} onNavigate={onNavigate} />

        {hasFavorites && (
          <div className="mt-5">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">{t("nav.favorites")}</p>
            {favProjects.map((p) => (
              <NavLink key={p.id} href={`/project?id=${p.id}`} icon={<ColorDot color={p.color} />} label={p.name} onNavigate={onNavigate} />
            ))}
            {favFilters.map((f) => (
              <NavLink key={f.id} href={`/filter?id=${f.id}`} icon={<FilterIcon size={15} />} label={f.name} onNavigate={onNavigate} />
            ))}
            {favLabels.map((l) => (
              <NavLink key={l.id} href={`/label?id=${l.id}`} icon={<Tag size={15} />} label={l.name} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {/* Projects */}
        <div className="mt-5">
          <div className="group flex items-center px-2 pb-1">
            <button onClick={() => setShowProjects((v) => !v)} className="flex flex-1 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-faint">
              {showProjects ? <ChevronDown size={12} /> : <ChevronRight size={12} className="rtl:rotate-180" />}
              {t("nav.projects")}
            </button>
            <button onClick={() => setProjectDialog({ open: true })} className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100" aria-label={t("aria.addProject")}>
              <Plus size={14} />
            </button>
          </div>
          {showProjects && roots.map((p) => renderTree(p, 0))}
        </div>

        {/* Labels */}
        <div className="mt-5">
          <div className="group flex items-center px-2 pb-1">
            <button onClick={() => setShowLabels((v) => !v)} className="flex flex-1 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-faint">
              {showLabels ? <ChevronDown size={12} /> : <ChevronRight size={12} className="rtl:rotate-180" />}
              {t("nav.labels")}
            </button>
            <button onClick={() => setLabelDialog({ open: true })} className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100" aria-label={t("aria.addLabel")}>
              <Plus size={14} />
            </button>
          </div>
          {showLabels &&
            (labels ?? []).map((l) => (
              <div key={l.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-hover">
                <Hash size={15} className="text-text-muted" />
                <Link href={`/label?id=${l.id}`} onClick={onNavigate} className="flex-1 truncate">
                  {l.name}
                </Link>
                <button onClick={() => setLabelDialog({ open: true, label: l })} className="rounded p-0.5 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100" aria-label={t("aria.editLabel")}>
                  <MoreHorizontal size={14} />
                </button>
                <button onClick={() => { if (confirm(t("label.deleteConfirm", { name: l.name }))) delLabel.mutate(l.id); }} className="rounded p-0.5 text-text-muted opacity-0 hover:text-[#d1453b] group-hover:opacity-100" aria-label={t("aria.deleteLabel")}>
                  ×
                </button>
              </div>
            ))}
        </div>
      </nav>

      <ProjectDialog
        open={projectDialog.open}
        project={projectDialog.project}
        parentId={projectDialog.parentId}
        onClose={() => setProjectDialog({ open: false })}
      />
      <LabelDialog open={labelDialog.open} label={labelDialog.label} onClose={() => setLabelDialog({ open: false })} />
    </div>
  );
}
