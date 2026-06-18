"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  Inbox,
  Search,
  Filter as FilterIcon,
  TrendingUp,
  Hash,
  Tag,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useProjects } from "@/lib/hooks/projects";
import { useLabels } from "@/lib/hooks/labels";
import { useFilters } from "@/lib/hooks/filters";
import { useT } from "@/lib/i18n";

type Item = { id: string; label: string; icon: React.ReactNode; action: () => void };

export function CommandMenu({
  open,
  onClose,
  onQuickAdd,
}: {
  open: boolean;
  onClose: () => void;
  onQuickAdd: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();
  const { data: filters } = useFilters();
  const [q, setQ] = useState("");

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    const base: Item[] = [
      { id: "add", label: t("nav.addTask"), icon: <Plus size={15} />, action: () => { onQuickAdd(); onClose(); } },
      { id: "today", label: t("nav.today"), icon: <CalendarDays size={15} />, action: go("/today") },
      { id: "upcoming", label: t("nav.upcoming"), icon: <CalendarClock size={15} />, action: go("/upcoming") },
      { id: "inbox", label: t("nav.inbox"), icon: <Inbox size={15} />, action: go("/inbox") },
      { id: "search", label: t("nav.search"), icon: <Search size={15} />, action: go("/search") },
      { id: "filters", label: t("nav.filtersLabels"), icon: <FilterIcon size={15} />, action: go("/filters") },
      { id: "productivity", label: t("nav.productivity"), icon: <TrendingUp size={15} />, action: go("/productivity") },
    ];
    (projects ?? []).filter((p) => !p.isInbox).forEach((p) =>
      base.push({ id: "p" + p.id, label: p.name, icon: <Hash size={15} />, action: go(`/project?id=${p.id}`) }),
    );
    (filters ?? []).forEach((f) =>
      base.push({ id: "f" + f.id, label: f.name, icon: <FilterIcon size={15} />, action: go(`/filter?id=${f.id}`) }),
    );
    (labels ?? []).forEach((l) =>
      base.push({ id: "l" + l.id, label: l.name, icon: <Tag size={15} />, action: go(`/label?id=${l.id}`) }),
    );
    return base;
  }, [projects, labels, filters, router, onClose, onQuickAdd, t]);

  const filtered = q.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filtered[0]) filtered[0].action();
        }}
        placeholder={t("cmd.placeholder")}
        className="mb-2 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="max-h-72 overflow-y-auto">
        {filtered.map((i) => (
          <button
            key={i.id}
            onClick={i.action}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg-hover"
          >
            <span className="text-text-muted">{i.icon}</span>
            {i.label}
          </button>
        ))}
        {filtered.length === 0 && <p className="px-2 py-4 text-sm text-text-muted">{t("cmd.none")}</p>}
      </div>
    </Modal>
  );
}
