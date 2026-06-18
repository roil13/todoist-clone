"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectView } from "@/components/views/project-view";

function ProjectPageInner() {
  const id = useSearchParams().get("id");
  if (!id) return null;
  return <ProjectView projectId={id} />;
}

export default function ProjectPage() {
  return (
    <Suspense fallback={null}>
      <ProjectPageInner />
    </Suspense>
  );
}
