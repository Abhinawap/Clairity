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
      className="grid size-8 place-items-center rounded-md text-[#DAF5EE] hover:bg-[#004346] hover:text-[#F2FBF9] focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
