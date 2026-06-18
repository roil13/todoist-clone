"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t("auth.invalid"));
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-6 shadow-sm">
      <h1 className="mb-5 text-xl font-semibold">{t("auth.loginTitle")}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? t("auth.loggingIn") : t("auth.login")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t("auth.signup")}
        </Link>
      </p>
    </div>
  );
}
