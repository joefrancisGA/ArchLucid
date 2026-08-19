"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { CommandPaletteProps } from "./CommandPalette";

/** Shared dynamic import used by the lazy component and shell shortcut preload (TB-560). */
export function preloadCommandPaletteChunk(): Promise<ComponentType<CommandPaletteProps>> {
  return import("./CommandPalette").then((module) => module.CommandPalette);
}

export const CommandPalette: ComponentType<CommandPaletteProps> = dynamic(
  () => preloadCommandPaletteChunk(),
  {
    ssr: false,
    loading: () => null,
  },
);
