"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type EditableTextProps = {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
};

/**
 * Minimal contentEditable: commits on blur. Updates DOM when `value` changes unless focused.
 */
export function EditableText({ value, onCommit, className }: EditableTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      contentEditable
      suppressHydrationWarning
      suppressContentEditableWarning
      className={cn(
        "rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? "").trim();
        if (next !== value.trim()) onCommit(next);
      }}
    />
  );
}
