"use client";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
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
    <div className="flex min-h-full flex-col bg-[#080C0E] text-[#F2FBF9]">
      <header className="flex h-14 items-center justify-between border-b border-[#004346]/70 bg-[#080C0E] px-6">
        <Link href="/" className="flex items-center focus-visible:outline-2 focus-visible:outline-[#09BC8A]">
          <Image
            src="/logos/Clairity_White.svg"
            alt="Clairity"
            width={117}
            height={24}
            priority
            className="h-6 w-auto"
          />
        </Link>
        <ThemeToggle />
      </header>

      <main className="grid flex-1 place-items-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-[#004346]/80 bg-[#172A3A] p-6 shadow-2xl">
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight text-[#F2FBF9]">
              {isLogin ? "Sign in to Clairity" : "Create your Clairity account"}
            </h1>
            <p className="text-xs text-[#DAF5EE]/70">
              {isLogin
                ? "Connect your VS Code or Cursor workspace to edit your React/Next.js components visually."
                : "Start editing your real React/Next.js source files visually with reviewable code diffs."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#004346] bg-[#004346]/40 text-xs font-medium text-[#F2FBF9] hover:bg-[#004346] focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
          >
            <Image
              src="/logos/GitHub_Invertocat_White.svg"
              alt=""
              width={16}
              height={16}
              className="size-4"
              aria-hidden
            />
            <span>Continue with GitHub</span>
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-[#DAF5EE]/50">
            <span className="h-px flex-1 bg-[#004346]" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-[#004346]" />
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
                <span className="font-medium text-[#DAF5EE]">Full name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="h-8 w-full rounded-md border border-[#004346] bg-[#080C0E]/70 px-2.5 text-xs text-[#F2FBF9] placeholder:text-[#DAF5EE]/40 focus:border-[#09BC8A] focus:outline-none"
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="font-medium text-[#DAF5EE]">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8 w-full rounded-md border border-[#004346] bg-[#080C0E]/70 px-2.5 text-xs text-[#F2FBF9] placeholder:text-[#DAF5EE]/40 focus:border-[#09BC8A] focus:outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-[#DAF5EE]">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 w-full rounded-md border border-[#004346] bg-[#080C0E]/70 px-2.5 text-xs text-[#F2FBF9] placeholder:text-[#DAF5EE]/40 focus:border-[#09BC8A] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#09BC8A] text-xs font-semibold text-[#080C0E] shadow-sm hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
            >
              <span>{isLogin ? "Sign in" : "Create account"}</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#DAF5EE]/70">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-[#09BC8A] hover:underline">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#09BC8A] hover:underline">
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
