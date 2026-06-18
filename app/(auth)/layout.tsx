import { redirect } from "next/navigation";
import { getServerT } from "@/lib/i18n/server";
import { getUserId } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? Skip the auth pages. (Previously handled by middleware.)
  if (await getUserId()) redirect("/today");
  const { t } = await getServerT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-sidebar px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-lg font-bold text-white">
            ✓
          </div>
          <span className="text-xl font-semibold">{t("common.appName")}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
