import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasks — a Todoist clone",
  description: "A personal task manager with projects, labels, filters, reminders and more.",
  appleWebApp: { capable: true, title: "Tasks" },
};

export const viewport = {
  themeColor: "#dc4c3e",
};

// lang/dir are set client-side by the I18n provider from the stored locale.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" data-theme="light" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
