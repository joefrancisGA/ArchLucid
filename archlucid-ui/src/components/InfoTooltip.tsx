import React from 'react';

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span 
      className="inline-flex items-center justify-center w-4 h-4 ml-1 text-xs font-bold text-white bg-gray-400 rounded-full cursor-help"
      title={text}
      aria-label={text}
    >
      ?
    </span>
  );
}
