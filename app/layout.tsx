import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasks — a Todoist clone",
  description: "A personal task manager with projects, labels, filters, reminders and more.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Tasks" },
};

export const viewport = {
  themeColor: "#dc4c3e",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      data-theme="light"
      className={`${geistSans.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
