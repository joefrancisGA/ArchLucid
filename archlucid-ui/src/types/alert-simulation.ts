import type { components } from "@/lib/openapi-schemas";

/** Outcome of simulating an alert rule against a single run (would it fire? be suppressed?). */
export type SimulatedAlertOutcome = components["schemas"]["SimulatedAlertOutcome"];

/** Aggregate simulation result: how many runs matched, would fire, would be suppressed. */
export type RuleSimulationResult = components["schemas"]["RuleSimulationResult"];

/** Side-by-side comparison of two alert rule candidates simulated against the same runs. */
export type RuleCandidateComparisonResult = components["schemas"]["RuleCandidateComparisonResult"];
