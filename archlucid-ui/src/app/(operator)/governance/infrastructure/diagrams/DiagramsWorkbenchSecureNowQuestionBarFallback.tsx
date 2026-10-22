"use client";

import {
  SecureNowQuestionQueueBar,
  useSecureNowQuestionQueue,
} from "@/components/infra-evidence/SecureNowQuestionQueue";
import type { ArchitectureDiagramMermaidViewerProps } from "@/components/architecture/ArchitectureDiagramViewer";

export function DiagramsWorkbenchSecureNowQuestionBarFallback(props: {
  readonly outline: ArchitectureDiagramMermaidViewerProps["outline"];
  readonly paintDiagramCanvas: boolean;
}): React.JSX.Element | null {
  // Same-file consumers were inlined above SecureNowQuestionQueueProvider by React Compiler.
  "use no memo";

  const { drawerOpen } = useSecureNowQuestionQueue();

  if (!drawerOpen || props.paintDiagramCanvas) {
    return null;
  }

  return <SecureNowQuestionQueueBar outline={props.outline ?? null} />;
}
