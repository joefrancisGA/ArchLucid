"use client";

import { useEffect } from "react";

import {
  buildFirstTouchFromSearchParams,
  readFirstTouchCookie,
  writeFirstTouchCookie,
} from "@/lib/marketing-first-touch";

/** Captures first-touch UTM params once per browser (TB-019). */
export function MarketingFirstTouchCapture() {
  useEffect(() => {
    if (readFirstTouchCookie()) return;

    const params = new URLSearchParams(window.location.search);
    const payload = buildFirstTouchFromSearchParams(params);

    if (payload) writeFirstTouchCookie(payload);
  }, []);

  return null;
}
