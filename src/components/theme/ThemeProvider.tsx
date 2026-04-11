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
  // Lazy initializer — reads localStorage once on mount, no effect needed
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("rfp-theme") as Theme) ?? "dark";
  });
  const rippleRef = useRef<HTMLDivElement | null>(null);

  // Apply the initial theme class to <html> on mount
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
      {/* GSAP ripple overlay — sits above everything during transition */}
      <div
        ref={rippleRef}
        id="theme-ripple"
        aria-hidden="true"
      />
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

function animateTransition(
  nextTheme: Theme,
  ripple: HTMLDivElement | null,
  originEl?: HTMLElement,
) {
  if (!ripple) {
    applyTheme(nextTheme);
    return;
  }

  // Determine ripple origin — center of the toggle button or screen center
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  }

  // Ripple needs to cover the entire viewport from the origin point
  const maxDist = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy),
  );
  const diameter = maxDist * 2;

  // Color of the incoming theme
  const rippleColor =
    nextTheme === "light"
      ? "rgb(210, 207, 199)"  // deep warm gray
      : "rgb(24, 24, 27)";    // dark zinc

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
      // Apply theme at peak of animation
      applyTheme(nextTheme);
      // Fade out the ripple
      gsap.to(ripple, {
        opacity: 0,
        duration: 0.25,
        ease: "power1.out",
        onComplete: () => {
          gsap.set(ripple, { scale: 0, opacity: 0 });
        },
      });
    },
  });
}
