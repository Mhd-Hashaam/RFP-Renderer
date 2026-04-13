"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Elastic bounce using raw wheel events.
 * When at scroll boundary, accumulates overshoot from wheel delta
 * then springs back with a damped animation.
 */
function attachElasticBounce(wrapper: HTMLElement, content: HTMLElement) {
  const MAX_OVERSHOOT = 80;
  const STIFFNESS = 0.08;
  const DAMPING = 0.68;

  let overshoot = 0;
  let vel = 0;
  let rafId = 0;
  let wheelEndTimer = 0;

  const stopSpring = () => {
    cancelAnimationFrame(rafId);
    overshoot = 0;
    vel = 0;
    content.style.transform = "";
    content.style.willChange = "";
  };

  const spring = () => {
    vel = (vel - STIFFNESS * overshoot) * DAMPING;
    overshoot += vel;

    if (Math.abs(overshoot) < 0.2 && Math.abs(vel) < 0.2) {
      stopSpring();
      return;
    }

    content.style.transform = `translateY(${overshoot.toFixed(2)}px)`;
    rafId = requestAnimationFrame(spring);
  };

  const startSpring = () => {
    cancelAnimationFrame(rafId);
    vel = -overshoot * 0.15;
    rafId = requestAnimationFrame(spring);
  };

  const onWheel = (e: WheelEvent) => {
    const scrollTop = wrapper.scrollTop;
    const maxScroll = wrapper.scrollHeight - wrapper.clientHeight;
    const atTop = scrollTop <= 2;
    const atBottom = scrollTop >= maxScroll - 2;

    if (!atTop && !atBottom) {
      if (overshoot !== 0) stopSpring();
      return;
    }

    const goingUp = e.deltaY < 0;
    const goingDown = e.deltaY > 0;

    if ((atTop && goingUp) || (atBottom && goingDown)) {
      const push = e.deltaY * 0.25;
      overshoot = Math.max(-MAX_OVERSHOOT, Math.min(MAX_OVERSHOOT, overshoot - push));
      content.style.willChange = "transform";
      content.style.transform = `translateY(${overshoot.toFixed(2)}px)`;

      clearTimeout(wheelEndTimer);
      wheelEndTimer = window.setTimeout(startSpring, 80);
    }
  };

  wrapper.addEventListener("wheel", onWheel, { passive: true });

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(wheelEndTimer);
    wrapper.removeEventListener("wheel", onWheel);
    content.style.transform = "";
    content.style.willChange = "";
  };
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const wrapper = document.getElementById("lenis-scroll-container");
    if (!wrapper) return;

    const contentEl = wrapper.firstElementChild as HTMLElement ?? wrapper;

    const instance = new Lenis({
      wrapper,
      content: contentEl,
      autoRaf: true,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
      overscroll: true,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    const cleanupBounce = prefersReducedMotion
      ? () => {}
      : attachElasticBounce(wrapper, contentEl);

    return () => {
      instance.destroy();
      cleanupBounce();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
