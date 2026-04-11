"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

type EditableTextProps = {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
};

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

  const focusAtEnd = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const save = () => {
    const el = ref.current;
    if (!el) return;
    const next = (el.textContent ?? "").trim();
    if (next !== value.trim()) onCommit(next);
    el.blur();
  };

  const cancel = () => {
    const el = ref.current;
    if (!el) return;
    // Restore original value
    el.textContent = value;
    el.blur();
  };

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
          focused && "bg-muted/30 px-1",
          className,
        )}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Delay so save/cancel button clicks register before blur fires
          setTimeout(() => {
            if (!ref.current) return;
            setFocused(false);
          }, 150);
          const next = (e.currentTarget.textContent ?? "").trim();
          if (next !== value.trim()) onCommit(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            cancel();
          }
        }}
      />

      {/* Pencil — shown on hover when not editing */}
      {!focused && (
        <button
          type="button"
          aria-label="Edit"
          onClick={focusAtEnd}
          className={cn(
            "mt-0.5 shrink-0 cursor-pointer rounded-sm p-0.5",
            "text-muted-foreground/0 transition-all duration-150",
            "group-hover/edit:text-muted-foreground/50",
            "hover:!text-muted-foreground hover:bg-muted/50",
          )}
        >
          <Pencil className="size-3" aria-hidden />
        </button>
      )}

      {/* Save / Cancel — shown while editing */}
      {focused && (
        <span className="mt-0.5 flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Save edit"
            onMouseDown={(e) => {
              e.preventDefault(); // prevent blur before click
              save();
            }}
            className="cursor-pointer rounded-sm p-0.5 text-emerald-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <Check className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Cancel edit"
            onMouseDown={(e) => {
              e.preventDefault(); // prevent blur before click
              cancel();
            }}
            className="cursor-pointer rounded-sm p-0.5 text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      )}
    </span>
  );
}
