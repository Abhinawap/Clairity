"use client";
import { ArrowRight, Code2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

// shortcut: navigates straight to / on submit until user auth exists (deferred in project-spec.md)
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-blue-500">
          <span className="grid size-7 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white">C</span>
          <span className="font-semibold tracking-tight">Clairity</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="grid flex-1 place-items-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight">
              {isLogin ? "Sign in to Clairity" : "Create your Clairity account"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLogin
                ? "Connect your VS Code or Cursor workspace to edit your React/Next.js components visually."
                : "Start editing your real React/Next.js source files visually with reviewable code diffs."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Code2 className="size-4" aria-hidden />
            <span>Continue with GitHub</span>
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/");
            }}
            className="space-y-3 text-xs"
          >
            {!isLogin && (
              <label className="block space-y-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Full name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-blue-600 text-xs font-medium text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <span>{isLogin ? "Sign in" : "Create account"}</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
