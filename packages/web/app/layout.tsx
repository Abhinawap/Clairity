import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const dirtyline = localFont({
  src: "./fonts/Dirtyline 36daysoftype 2022.otf",
  variable: "--font-dirtyline",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clairity — Your design, your files, supercharged with AI",
  description: "Edit your real React/Next.js page visually; every Edit becomes a small, reviewable diff in your own code.",
  icons: {
    icon: "/logos/favicon.png",
  },
};

// Runs before paint so a saved or system dark theme never flashes light first.
const themeScript = `if (localStorage.theme === "dark" || (!localStorage.theme && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable} ${dirtyline.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full font-sans bg-[#F2FBF9] text-[#172A3A] selection:bg-[#DAF5EE] selection:text-[#004346] dark:bg-[#080C0E] dark:text-[#F2FBF9] dark:selection:bg-[#004346] dark:selection:text-[#DAF5EE] transition-colors">
        {children}
      </body>
    </html>
  );
}
