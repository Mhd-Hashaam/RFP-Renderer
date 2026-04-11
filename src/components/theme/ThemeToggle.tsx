"use client";

import { useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => toggle(btnRef.current ?? undefined)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-14 cursor-pointer items-center rounded-full border p-1",
        "transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:opacity-90",
        isDark
          ? "border-white/10 bg-zinc-800"
          : "border-stone-300 bg-stone-200",
      )}
    >
      <Sun
        className={cn(
          "absolute left-1.5 size-4 transition-all duration-300",
          isDark ? "opacity-25 scale-75" : "opacity-100 scale-100 text-amber-600",
        )}
      />
      <Moon
        className={cn(
          "absolute right-1.5 size-4 transition-all duration-300",
          isDark ? "opacity-100 scale-100 text-indigo-300" : "opacity-25 scale-75",
        )}
      />
      <span
        className={cn(
          "absolute size-6 rounded-full shadow-md transition-all duration-300 ease-in-out",
          isDark
            ? "left-[calc(100%-1.75rem)] bg-zinc-700 ring-1 ring-white/10"
            : "left-1 bg-stone-200 ring-1 ring-stone-400",
        )}
      />
    </button>
  );
}
