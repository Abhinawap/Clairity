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
      className="grid size-9 place-items-center rounded-md text-[#004346] transition-colors hover:bg-[#004346]/8 hover:text-[#080C0E] focus-visible:outline-2 focus-visible:outline-[#09BC8A] sm:size-8 dark:text-[#DAF5EE] dark:hover:bg-[#DAF5EE]/10 dark:hover:text-[#F2FBF9]"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
