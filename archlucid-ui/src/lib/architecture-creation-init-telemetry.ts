export type ArchitectureCreationInitPhase =
  | "draft-restore"
  | "draft-create"
  | "question-definition"
  | "question-fetch"
  | "total";

export type ArchitectureCreationInitTimings = Partial<Record<ArchitectureCreationInitPhase, number>>;

type ClarityWindow = Window & {
  clarity?: (command: string, eventName: string) => void;
};

/** Internal-only timing for architecture creation init — never shown in customer UI. */
export function emitArchitectureCreationInitTelemetry(
  timings: ArchitectureCreationInitTimings,
  outcome: "ready" | "failed",
): void {
  try {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
      console.debug("[architecture-creation-init]", { outcome, timings, at: new Date().toISOString() });
    }

    const clarityWindow = window as ClarityWindow;

    if (typeof clarityWindow.clarity === "function" && outcome === "failed") {
      clarityWindow.clarity("event", "architecture_creation_init_failed");
    }
  } catch {
    /* telemetry must never block architecture creation */
  }
}

export async function measureArchitectureCreationPhase<T>(
  phase: ArchitectureCreationInitPhase,
  timings: ArchitectureCreationInitTimings,
  action: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();
  const result = await action();
  timings[phase] = Math.round(performance.now() - startedAt);

  return result;
}

export function markArchitectureCreationPhase(
  phase: ArchitectureCreationInitPhase,
  timings: ArchitectureCreationInitTimings,
  startedAt: number,
): void {
  timings[phase] = Math.round(performance.now() - startedAt);
}
