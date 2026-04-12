"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggle: (originEl?: HTMLElement) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("rfp-theme") as Theme) ?? "dark";
  });
  const rippleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (originEl?: HTMLElement) => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("rfp-theme", next);
      animateTransition(next, rippleRef.current, originEl);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
      <div ref={rippleRef} id="theme-ripple" aria-hidden="true" />
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Freeze all CSS transitions on the page, run callback, then unfreeze
 * after the next two animation frames (enough for the browser to repaint
 * with the new theme before transitions re-engage).
 */
function withFrozenTransitions(callback: () => void) {
  const style = document.createElement("style");
  style.id = "rfp-freeze-transitions";
  style.textContent = `*, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }`;
  document.head.appendChild(style);

  callback();

  // Two rAFs: first lets the DOM update, second lets the browser paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove();
    });
  });
}

function animateTransition(
  nextTheme: Theme,
  ripple: HTMLDivElement | null,
  originEl?: HTMLElement,
) {
  if (!ripple) {
    withFrozenTransitions(() => applyTheme(nextTheme));
    return;
  }

  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  }

  const maxDist = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy),
  );
  const diameter = maxDist * 2;

  const rippleColor =
    nextTheme === "light"
      ? "rgb(210, 207, 199)"
      : "rgb(10, 10, 10)";

  gsap.set(ripple, {
    width: diameter,
    height: diameter,
    left: cx - diameter / 2,
    top: cy - diameter / 2,
    backgroundColor: rippleColor,
    borderRadius: "50%",
    scale: 0,
    opacity: 1,
  });

  gsap.to(ripple, {
    scale: 1,
    duration: 0.55,
    ease: "power2.inOut",
    onComplete: () => {
      // Freeze CSS transitions, swap theme, then unfreeze — zero flash
      withFrozenTransitions(() => applyTheme(nextTheme));

      // Fade out ripple after theme is applied and painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gsap.to(ripple, {
            opacity: 0,
            duration: 0.3,
            ease: "power1.out",
            onComplete: () => {
              gsap.set(ripple, { scale: 0, opacity: 0 });
            },
          });
        });
      });
    },
  });
}
