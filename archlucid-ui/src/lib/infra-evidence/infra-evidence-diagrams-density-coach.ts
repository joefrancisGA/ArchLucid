export type InfraDiagramsDensityCoachInput = {
  readonly showFallbackCards: boolean;
  readonly tooLargeForBrowser: boolean;
  readonly diagramContentEmpty: boolean;
  readonly renderStatus: string;
  readonly paintDiagramCanvas: boolean;
  readonly selectedMode: string;
  readonly nodeCount: number | null;
  readonly maxNodes: number;
  readonly isExecutiveMode: boolean;
};

export function shouldShowInfraDiagramsDensityCoach(input: InfraDiagramsDensityCoachInput): boolean {
  if (currentViewIsReadable(input)) {
    return false;
  }

  if (input.isExecutiveMode) {
    return executiveModeNeedsCoach(input);
  }

  return (
    input.showFallbackCards
    || input.tooLargeForBrowser
    || emptySucceededPaint(input)
    || isFailedRender(input)
    || isOverPeelBudget(input)
  );
}

function currentViewIsReadable(input: InfraDiagramsDensityCoachInput): boolean {
  return input.paintDiagramCanvas && !input.tooLargeForBrowser && !isOverPeelBudget(input);
}

function executiveModeNeedsCoach(input: InfraDiagramsDensityCoachInput): boolean {
  return emptySucceededPaint(input) || isFailedRender(input);
}

function emptySucceededPaint(input: InfraDiagramsDensityCoachInput): boolean {
  return input.diagramContentEmpty && input.renderStatus === "Succeeded";
}

function isFailedRender(input: InfraDiagramsDensityCoachInput): boolean {
  return input.renderStatus === "Failed";
}

function isOverPeelBudget(input: InfraDiagramsDensityCoachInput): boolean {
  if (input.nodeCount == null) {
    return false;
  }

  return input.nodeCount >= input.maxNodes && input.selectedMode !== "executive";
}
