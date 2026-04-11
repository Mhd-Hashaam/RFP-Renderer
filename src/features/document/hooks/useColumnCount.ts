"use client";

import { COLUMN_COUNT_LG, COLUMN_COUNT_MD, COLUMN_COUNT_SM } from "../model/constants";
import { useEffect, useState } from "react";

/**
 * Responsive column count for the document grid.
 */
export function useColumnCount(): number {
  const [count, setCount] = useState(COLUMN_COUNT_LG);

  useEffect(() => {
    const md = window.matchMedia("(max-width: 1023px)");
    const sm = window.matchMedia("(max-width: 639px)");

    const update = () => {
      if (sm.matches) setCount(COLUMN_COUNT_SM);
      else if (md.matches) setCount(COLUMN_COUNT_MD);
      else setCount(COLUMN_COUNT_LG);
    };

    update();
    md.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  return count;
}
