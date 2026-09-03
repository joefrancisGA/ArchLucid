"use client";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { cn } from "@/lib/utils";

export function runDetailDeferredLoading(
  label: string,
  heightClass: string,
  extraClassName?: string,
): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      className={extraClassName ? cn(heightClass, extraClassName) : heightClass}
    />
  );
}
