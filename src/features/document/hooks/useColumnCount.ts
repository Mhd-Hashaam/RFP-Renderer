"use client";

import { useEffect, useState } from "react";
import type { DeviceCapability } from "../model/types";

/**
 * Returns the current device capability based on viewport width.
 *
 * Breakpoints:
 *   < 768px   → "mobile"
 *   768–1279px → "tablet"
 *   ≥ 1280px  → "desktop"
 *
 * SSR-safe: defaults to "desktop" on the server.
 */
export function useColumnCount(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>("desktop");

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const desktop = window.matchMedia("(min-width: 1280px)");

    const update = () => {
      if (mobile.matches) {
        setCapability("mobile");
      } else if (desktop.matches) {
        setCapability("desktop");
      } else {
        setCapability("tablet");
      }
    };

    update();
    mobile.addEventListener("change", update);
    desktop.addEventListener("change", update);

    return () => {
      mobile.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
    };
  }, []);

  return capability;
}
