import { ListView } from "@/components/views/list-view";

export default function TodayPage() {
  const now = new Date();
  const todayISO = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();

  return (
    <ListView
      titleKey="today.title"
      query={{ view: "today" }}
      showProject
      defaultDueDate={todayISO}
      emptyKey="today.empty"
    />
  );
}
