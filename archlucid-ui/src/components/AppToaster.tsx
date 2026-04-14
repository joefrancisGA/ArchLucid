"use client";

import { Toaster } from "sonner";

/** Root toast host (Sonner). Render once in the app layout. */
export function AppToaster() {
  return <Toaster position="bottom-right" richColors closeButton />;
}
