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
    <div className="flex min-h-full flex-col bg-[#F2FBF9] text-[#172A3A] dark:bg-[#172A3A] dark:text-[#F2FBF9]">
      <header className="flex h-14 items-center justify-between border-b border-[#DAF5EE] bg-white px-6 dark:border-[#004346] dark:bg-[#172A3A]">
        <Link href="/" className="flex items-center focus-visible:outline-2 focus-visible:outline-[#09BC8A]">
          <Image
            src="/logos/Clairity_Black.svg"
            alt="Clairity"
            width={117}
            height={24}
            priority
            className="h-6 w-auto dark:hidden"
          />
          <Image
            src="/logos/Clairity_White.svg"
            alt="Clairity"
            width={117}
            height={24}
            priority
            className="hidden h-6 w-auto dark:block"
          />
        </Link>
        <ThemeToggle />
      </header>

      <main className="grid flex-1 place-items-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-[#DAF5EE] bg-white p-6 shadow-sm dark:border-[#004346] dark:bg-[#004346]/20">
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight text-[#172A3A] dark:text-[#F2FBF9]">
              {isLogin ? "Sign in to Clairity" : "Create your Clairity account"}
            </h1>
            <p className="text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">
              {isLogin
                ? "Connect your VS Code or Cursor workspace to edit your React/Next.js components visually."
                : "Start editing your real React/Next.js source files visually with reviewable code diffs."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#DAF5EE] bg-[#F2FBF9] text-xs font-medium text-[#172A3A] hover:bg-[#DAF5EE] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:border-[#004346] dark:bg-[#004346]/40 dark:text-[#F2FBF9] dark:hover:bg-[#004346]"
          >
            <Image
              src="/logos/GitHub_Invertocat_Black.svg"
              alt=""
              width={16}
              height={16}
              className="size-4 dark:hidden"
              aria-hidden
            />
            <Image
              src="/logos/GitHub_Invertocat_White.svg"
              alt=""
              width={16}
              height={16}
              className="hidden size-4 dark:block"
              aria-hidden
            />
            <span>Continue with GitHub</span>
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-[#004346]/60 dark:text-[#DAF5EE]/60">
            <span className="h-px flex-1 bg-[#DAF5EE] dark:bg-[#004346]" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-[#DAF5EE] dark:bg-[#004346]" />
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
                <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Full name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#172A3A]/60 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40"
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#172A3A]/60 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#172A3A]/60 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#09BC8A] text-xs font-semibold text-white shadow-xs hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A]"
            >
              <span>{isLogin ? "Sign in" : "Create account"}</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-[#09BC8A] hover:underline dark:text-[#09BC8A]">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#09BC8A] hover:underline dark:text-[#09BC8A]">
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
