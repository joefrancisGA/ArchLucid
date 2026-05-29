/** Operator-safe proof/diagnostics messaging — CLI details stay behind disclosures. */

export const FIRST_PILOT_PROOF_STATUS_UNAVAILABLE =
  "Proof status unavailable. Open diagnostics to refresh proof readiness.";

export const FIRST_PILOT_PROOF_NOT_RUN_COPY =
  "Pilot proof has not been collected yet. Finalize a review, then open diagnostics to refresh.";

export const FIRST_PILOT_SPONSOR_PROOF_DIAGNOSTICS_LINE =
  "Open diagnostics to run the proof check after finalize.";

export const FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY = "Show technical command";

export const FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND = "dotnet run --project ArchLucid.Cli -- pilot proof";

export const FIRST_PILOT_PROOF_REFRESH_SNAPSHOT_COMMAND =
  "python scripts/ci/write_first_pilot_proof_status_snapshot.py";

export const FIRST_PILOT_SPONSOR_PROOF_CLI_COMMAND =
  "dotnet run --project ArchLucid.Cli -- pilot proof -RunId <id>";

export const FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA = "Open system status";

export const FIRST_PILOT_READINESS_REVIEW_PERMISSIONS_CTA = "Review permissions";
