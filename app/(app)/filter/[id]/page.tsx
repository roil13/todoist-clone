import { FilterView } from "@/components/views/filter-view";

export default async function FilterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FilterView filterId={id} />;
}
