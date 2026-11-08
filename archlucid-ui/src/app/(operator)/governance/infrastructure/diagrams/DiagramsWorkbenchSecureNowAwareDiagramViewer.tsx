"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArchitectureDiagramViewer,
  type ArchitectureDiagramMermaidViewerProps,
} from "@/components/architecture/ArchitectureDiagramViewer";
import {
  SecureNowQuestionQueueBar,
  useSecureNowQuestionQueue,
  useSecureNowQuestionSubjectNodeId,
} from "@/components/infra-evidence/SecureNowQuestionQueue";
import {
  diagramOutlineIncludesFocusResource,
  resolveDiagramCameraFocusNodeIds,
} from "@/lib/architecture/architecture-diagram-camera-focus";

type DiagramsWorkbenchSecureNowAwareDiagramViewerProps = ArchitectureDiagramMermaidViewerProps & {
  readonly embedQuestionBarInViewport: boolean;
};

export function DiagramsWorkbenchSecureNowAwareDiagramViewer(
  props: DiagramsWorkbenchSecureNowAwareDiagramViewerProps,
): React.JSX.Element {
  // Keep this module boundary so React Compiler cannot inline the queue hook into the
  // workbench parent that mounts SecureNowQuestionQueueProvider around these children.
  "use no memo";

  const { embedQuestionBarInViewport, ...viewerProps } = props;
  const { drawerOpen, currentQuestion } = useSecureNowQuestionQueue();
  const questionSubjectNodeId = useSecureNowQuestionSubjectNodeId();
  const [questionFocusNonce, setQuestionFocusNonce] = useState(0);

  useEffect(() => {
    if (!drawerOpen || currentQuestion == null) {
      return;
    }

    setQuestionFocusNonce((current) => current + 1);
  }, [currentQuestion?.questionKey, currentQuestion?.resourceId, drawerOpen]);

  const questionCameraFocusNodeIds = useMemo(() => {
    if (!drawerOpen || questionSubjectNodeId == null || questionSubjectNodeId.length === 0) {
      return [];
    }

    if (!diagramOutlineIncludesFocusResource(viewerProps.outline, questionSubjectNodeId)) {
      return [];
    }

    return resolveDiagramCameraFocusNodeIds(questionSubjectNodeId, viewerProps.outline);
  }, [drawerOpen, viewerProps.outline, questionSubjectNodeId]);

  const effectiveFocusNodeIds = questionCameraFocusNodeIds.length > 0
    ? questionCameraFocusNodeIds
    : viewerProps.focusNodeIds;
  const effectiveFocusNonce = questionCameraFocusNodeIds.length > 0
    ? questionFocusNonce
    : viewerProps.focusNonce;

  const viewportHeader = drawerOpen && embedQuestionBarInViewport
    ? <SecureNowQuestionQueueBar outline={viewerProps.outline ?? null} />
    : null;

  return (
    <ArchitectureDiagramViewer
      {...viewerProps}
      focusNodeIds={effectiveFocusNodeIds}
      focusNonce={effectiveFocusNonce}
      questionSubjectNodeId={drawerOpen ? questionSubjectNodeId : null}
      viewportHeader={viewportHeader}
    />
  );
}
