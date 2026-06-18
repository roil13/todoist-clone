"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FilterView } from "@/components/views/filter-view";

function FilterPageInner() {
  const id = useSearchParams().get("id");
  if (!id) return null;
  return <FilterView filterId={id} />;
}

export default function FilterPage() {
  return (
    <Suspense fallback={null}>
      <FilterPageInner />
    </Suspense>
  );
}
