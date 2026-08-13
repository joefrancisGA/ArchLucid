namespace ArchLucid.Cli.Commands;

/// <summary>Buyer-safe index for sponsor proof packet folders (Improvement #7).</summary>
public static class PilotProofPacketIndexBuilder
{
    public const string Schema = "archlucid.proof-packet.index.v1";

    public static string BuildJson(
        string runId,
        bool pilotStrictSatisfied,
        bool demoWarning,
        string? structuralExecutionModeLabel = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        var payload = new
        {
            schema = Schema,
            runId,
            generatedUtc = DateTimeOffset.UtcNow.ToString("O"),
            pilotStrictSatisfied,
            demoWarning,
            structuralExecutionMode = structuralExecutionModeLabel ?? "(not captured)",
            whatThisProves = new[]
            {
                "One committed architecture review produced durable findings, governance posture, and audit samples.",
                "ROI and first-value narratives are tied to authoritative API responses for the run id.",
                "Redaction manifest documents buyer-safe fields only — no secrets in the packet folder.",
            },
            whatThisDoesNotProve = new[]
            {
                "Third-party pen test, CPA SOC 2 attestation, or production-scale tenant isolation.",
                "Full real-mode LLM quality when execution mode is simulator-only or PilotStrict is not satisfied.",
                "Procurement legal review — limitations.md and quote-to-proof-readiness.json state explicit gaps.",
            },
            artifacts = new[]
            {
                new { file = "proof-summary.md", role = "Sponsor-first narrative when first-value report is available." },
                new { file = "run-evidence.json", role = "Authoritative pilot-run-deltas payload for the committed run." },
                new { file = "quote-to-proof-readiness.json", role = "Commercial readiness and claim posture for sponsor handoff." },
                new { file = "governance-outcome-summary.json", role = "Governance disposition summary for the review." },
                new { file = "audit-evidence-summary.json", role = "Audit trail sample ids and coverage summary." },
                new { file = "limitations.md", role = "Explicit skipped gates, demo warnings, and non-claims." },
                new { file = "redaction-manifest.json", role = "Redaction pass status and optional file integrity hashes." },
            },
        };

        return System.Text.Json.JsonSerializer.Serialize(payload, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    public static string BuildMarkdown(
        string runId,
        bool pilotStrictSatisfied,
        string? structuralExecutionModeLabel = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string strictLine = pilotStrictSatisfied
            ? "PilotStrict evidence is **satisfied** for this run — sponsor handoff is permitted when other org gates pass."
            : "PilotStrict evidence is **not satisfied** — treat this packet as internal-only until gaps in limitations.md are closed.";

        string executionLine = PilotProofPacketStructuralExecutionModeFormatter.BuildSponsorCaveatLine(
            structuralExecutionModeLabel);

        return $"""
            # Sponsor proof packet index

            Run id: `{runId}`

            {executionLine}

            {strictLine}

            ## What this proves

            - A committed review produced durable findings, governance posture, and audit samples.
            - ROI and first-value narratives reference authoritative API data for this run id.
            - The folder is redacted for buyer-safe sharing (see `redaction-manifest.json`).

            ## What this does not prove

            - Third-party pen test, CPA SOC 2 attestation, or production-scale isolation.
            - Full real-mode LLM quality when execution stayed simulator-only.
            - Legal/procurement sign-off — read `limitations.md` and `quote-to-proof-readiness.json`.

            ## Artifact map

            | File | Role |
            | --- | --- |
            | `proof-summary.md` | Sponsor-first narrative when available |
            | `run-evidence.json` | Authoritative pilot-run-deltas |
            | `quote-to-proof-readiness.json` | Commercial readiness posture |
            | `governance-outcome-summary.json` | Governance disposition |
            | `audit-evidence-summary.json` | Audit sample summary |
            | `limitations.md` | Skipped gates and explicit non-claims |
            | `redaction-manifest.json` | Redaction / integrity metadata |
            """;
    }
}
