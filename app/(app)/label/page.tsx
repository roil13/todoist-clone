"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListView } from "@/components/views/list-view";
import { useLabels } from "@/lib/hooks/labels";

function LabelPageInner() {
  const id = useSearchParams().get("id");
  const { data: labels } = useLabels();
  if (!id) return null;
  const label = labels?.find((l) => l.id === id);
  return (
    <ListView
      title={`@${label?.name ?? "Label"}`}
      query={{ labelId: id }}
      showProject
      emptyKey="label.none"
    />
  );
}

export default function LabelPage() {
  return (
    <Suspense fallback={null}>
      <LabelPageInner />
    </Suspense>
  );
}
