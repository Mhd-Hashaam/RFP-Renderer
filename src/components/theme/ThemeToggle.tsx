"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-14 cursor-pointer items-center rounded-full border p-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark
          ? "border-white/10 bg-zinc-800"
          : "border-zinc-200 bg-zinc-100",
      )}
    >
      {/* Track icons */}
      <Sun
        className={cn(
          "absolute left-1.5 size-4 transition-opacity duration-300",
          isDark ? "opacity-30" : "opacity-100 text-amber-500",
        )}
      />
      <Moon
        className={cn(
          "absolute right-1.5 size-4 transition-opacity duration-300",
          isDark ? "opacity-100 text-blue-400" : "opacity-30",
        )}
      />

      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute size-6 rounded-full shadow-md transition-all duration-300 ease-in-out",
          isDark
            ? "left-[calc(100%-1.75rem)] bg-zinc-900 ring-1 ring-white/10"
            : "left-1 bg-white ring-1 ring-zinc-200",
        )}
      />
    </button>
  );
}
