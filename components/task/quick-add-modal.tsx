"use client";

import { Modal } from "@/components/ui/modal";
import { SmartQuickAdd } from "./smart-quick-add";
import { useT } from "@/lib/i18n";

export function QuickAddModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t("task.addTask")} width="max-w-lg">
      <SmartQuickAdd onDone={onClose} />
    </Modal>
  );
}
