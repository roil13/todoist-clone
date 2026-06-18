"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("auth.createError"));
      }
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) throw new Error(t("auth.createdPleaseLogin"));
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError"));
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-6 shadow-sm">
      <h1 className="mb-5 text-xl font-semibold">{t("auth.registerTitle")}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t("auth.nameOptional")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
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
          minLength={6}
          placeholder={t("auth.passwordMin")}
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
          {loading ? t("auth.creating") : t("auth.signup")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </div>
  );
}
