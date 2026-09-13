import { SYSTEM_GRAVITY_HELP_SLUG } from "@/lib/system-gravity-help-route";

/** SG-107 — help: system vs job vs inspector on Working (Record/Practice per ADR 0097). */
export { SYSTEM_GRAVITY_HELP_SLUG };

export const SYSTEM_GRAVITY_HELP_TITLE = "System gravity" as const;

export const SYSTEM_GRAVITY_HELP_OVERVIEW =
  "On Working, the named architecture is the instrument after spawn — not the nested review inspector. The architecture desk is where you resume Monday morning. A nested review is a child job: findings, finalize, and wait chrome are verbs on that job, not a second Home. Sketch a change is Practice; Record what-if is the capped Career run. Guided and demo sessions keep peer review URLs and the evaluator stepper." as const;

export const SYSTEM_GRAVITY_HELP_CONCEPT_TILES = [
  {
    title: "System (architecture desk)",
    body: "The durable object you open with Alt+R. Sketch a change and Record what-if are desk verbs on the architecture identity.",
  },
  {
    title: "Job (nested review)",
    body: "A run nested under `/architecture/architectures/{id}/reviews/{runId}`. Inspect findings and finalize here without making this route your Working Home.",
  },
  {
    title: "Inspector, not exile",
    body: "Spawn does not hide the desk. When ArchitectureId is known, chrome and deep links prefer nested locators; unlinked runs stay on honest peer URLs.",
  },
] as const;
