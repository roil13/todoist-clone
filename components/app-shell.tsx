"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ReminderPoller } from "@/components/reminder-poller";
import { CommandMenu } from "@/components/command-menu";
import { QuickAddModal } from "@/components/task/quick-add-modal";
import { OfflineBanner } from "@/components/offline-banner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [cmd, setCmd] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
        return;
      }
      if (typing) return;
      if (e.key === "q") {
        e.preventDefault();
        setQuickAdd(true);
      }
    }
    function onOpenQuickAdd() {
      setQuickAdd(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-quick-add", onOpenQuickAdd);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-quick-add", onOpenQuickAdd);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "z-30 w-72 shrink-0 border-e border-border bg-bg-sidebar",
          "md:static md:translate-x-0",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:transition-transform",
          sidebarOpen
            ? "max-md:translate-x-0"
            : "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full",
        )}
      >
        <Sidebar userName={userName} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <button aria-label={t("aria.openMenu")} onClick={() => setSidebarOpen(true)} className="rounded p-1 hover:bg-bg-hover">
            <Menu size={20} />
          </button>
          <span className="font-semibold">{t("common.appName")}</span>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      <ReminderPoller />
      <CommandMenu open={cmd} onClose={() => setCmd(false)} onQuickAdd={() => setQuickAdd(true)} />
      <QuickAddModal open={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  );
}
