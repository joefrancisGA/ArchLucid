"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { CommandPaletteProps } from "./CommandPalette";

/** Shared dynamic import used by the lazy component and shell shortcut preload (TB-560). */
export function preloadCommandPaletteChunk(): Promise<ComponentType<CommandPaletteProps>> {
  return import("./CommandPalette").then((module) => module.CommandPalette);
}

export const CommandPalette: ComponentType<CommandPaletteProps> = createDeferredComponentFromManifest(
  "app-shell-command-palette",
  { suppressLoading: true },
) as ComponentType<CommandPaletteProps>;
