import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  formatArchitectureObjectMapSentence,
  type ArchitectureObjectMapFocus,
} from "@/lib/vocabulary/architecture-object-map";

type ArchitectureObjectMapStripProps = {
  readonly focus: ArchitectureObjectMapFocus;
};

/** TB-2354 — Persistent three-object map on architecture hubs. */
export function ArchitectureObjectMapStrip(props: ArchitectureObjectMapStripProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="architecture-object-map-strip"
    >
      {formatArchitectureObjectMapSentence(props.focus)}
    </p>
  );
}
