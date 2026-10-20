"use client";
import { Moon, Sun } from "lucide-react";

// The icon follows the .dark class through CSS, so the server render never disagrees with the saved theme.
export function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-8 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
