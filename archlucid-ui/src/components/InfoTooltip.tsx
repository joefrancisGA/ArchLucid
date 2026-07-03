import { cn } from "@/lib/utils";
import React from 'react';

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span 
      className={cn("inline-flex items-center justify-center w-4 h-4 ml-1 font-bold text-white bg-gray-400 rounded-full cursor-help", OPERATOR_TYPOGRAPHY.helper)}
      title={text}
      aria-label={text}
    >
      ?
    </span>
  );
}
