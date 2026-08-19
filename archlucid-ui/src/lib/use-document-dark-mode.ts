"use client";

import { useEffect, useState } from "react";

export function useDocumentDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const readDark = (): void => {
      setDark(document.documentElement.classList.contains("dark"));
    };

    readDark();

    const observer = new MutationObserver(readDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return (): void => {
      observer.disconnect();
    };
  }, []);

  return dark;
}
