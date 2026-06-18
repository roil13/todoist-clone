import { ListView } from "@/components/views/list-view";

export default function InboxPage() {
  return (
    <ListView
      titleKey="inbox.title"
      query={{ view: "inbox" }}
      emptyKey="inbox.empty"
    />
  );
}
