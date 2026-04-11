"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type EditableTextProps = {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
};

/**
 * Minimal contentEditable: commits on blur.
 * Shows a pencil icon on hover to signal editability.
 */
export function EditableText({ value, onCommit, className }: EditableTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return (
    <span className="group/edit relative inline-flex w-full items-start gap-1">
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressHydrationWarning
        suppressContentEditableWarning
        className={cn(
          "min-w-0 flex-1 cursor-text rounded-sm outline-none transition-colors duration-150",
          "ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/60",
          focused && "bg-muted/30",
          className,
        )}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          const next = (e.currentTarget.textContent ?? "").trim();
          if (next !== value.trim()) onCommit(next);
        }}
      />
      {/* Edit hint icon — visible on hover, hidden when focused */}
      {!focused && (
        <Pencil
          className="mt-0.5 size-3 shrink-0 text-muted-foreground/0 transition-opacity duration-150 group-hover/edit:text-muted-foreground/50"
          aria-hidden
        />
      )}
    </span>
  );
}
