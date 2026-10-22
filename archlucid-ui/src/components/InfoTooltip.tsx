"use client";

import { InlineHelp } from "@/components/InlineHelp";

interface InfoTooltipProps {
  text: string;
  /** Accessible subject for the help trigger; defaults to the visible field label when provided. */
  label?: string;
}

/** @deprecated Prefer {@link InlineHelp} with an explicit field label. */
export function InfoTooltip({ text, label = "this field" }: InfoTooltipProps) {
  return <InlineHelp label={label} hint={text} />;
}
