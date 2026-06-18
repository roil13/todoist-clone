import { ListView } from "@/components/views/list-view";
import { prisma } from "@/lib/db";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const label = await prisma.label.findUnique({ where: { id }, select: { name: true } });

  return (
    <ListView
      title={`@${label?.name ?? "Label"}`}
      query={{ labelId: id }}
      showProject
      emptyKey="label.none"
    />
  );
}
