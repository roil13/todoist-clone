import { AppShell } from "@/components/app-shell";

// Local-first app: no server auth gate. The shell shows the local profile name
// (from settings / Google account once Drive is connected).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
