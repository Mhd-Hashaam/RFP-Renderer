"use client";

import { useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, mounted, toggle } = useTheme();
  const isDark = theme === "dark";
  const btnRef = useRef<HTMLButtonElement>(null);

  if (!mounted) {
    return (
      <div className="relative flex h-8 w-14 items-center rounded-full border border-border bg-muted p-1" />
    );
  }

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
          : "border-stone-500 bg-stone-300",
      )}
    >
      {/* Sun icon — prominent in light mode */}
      <Sun
        className={cn(
          "absolute left-1.5 size-3.5 transition-all duration-300",
          isDark
            ? "opacity-20 scale-75 text-white"
            : "opacity-100 scale-100 text-amber-600",
        )}
        aria-hidden="true"
      />
      {/* Moon icon — prominent in dark mode */}
      <Moon
        className={cn(
          "absolute right-1.5 size-3.5 transition-all duration-300",
          isDark
            ? "opacity-100 scale-100 text-indigo-300"
            : "opacity-60 scale-75 text-stone-700",
        )}
        aria-hidden="true"
      />
      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute size-5 rounded-full transition-all duration-300 ease-in-out",
          isDark
            ? "left-[calc(100%-1.625rem)] bg-zinc-600 shadow-md ring-1 ring-white/10"
            : "left-1 bg-stone-800 shadow-sm",
        )}
      />
    </button>
  );
}
