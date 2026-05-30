namespace ArchLucid.Cli.Support;

/// <summary>
///     Synthetic support-bundle triage drills for operator rehearsal (no secrets or live customer data).
/// </summary>
public static class SupportBundleTriageDrillCatalog
{
    public static IReadOnlyList<SupportBundleTriageDrillScenario> All { get; } =
    [
        new SupportBundleTriageDrillScenario
        {
            DrillId = "auth-loop",
            Title = "Auth redirect loop on operator login",
            LikelyCause = "OIDC callback URL or DevelopmentBypass mismatch between UI and API host.",
            EvidencePath = "triage-index.md → configModeSummary + health.readyHttpStatus",
            CorrelationFields = ["tenantId", "apiBaseUrlRedacted", "configModeSummary"],
            NextCommand = "archlucid doctor --api-base-url <host> && review config-lint-production-like-hosted-pilot.md",
        },
        new SupportBundleTriageDrillScenario
        {
            DrillId = "sql-not-ready",
            Title = "SQL readiness probe failing",
            LikelyCause = "Connection string missing, DbUp migration pending, or firewall blocking SQL.",
            EvidencePath = "triage-index.md → health.readyHttpStatus + hostVersionSummary",
            CorrelationFields = ["health.readyHttpStatus", "hostVersionSummary"],
            NextCommand = "curl <api>/health/ready && archlucid config lint --profile production-like-hosted-pilot",
        },
        new SupportBundleTriageDrillScenario
        {
            DrillId = "aoai-missing",
            Title = "Real-mode agent execution blocked by Azure OpenAI config",
            LikelyCause = "AzureOpenAI endpoint, deployment name, or credential transport not configured for production-like profile.",
            EvidencePath = "triage-index.md → structuralExecutionModeLabel + configModeSummary",
            CorrelationFields = ["run.runId", "structuralExecutionModeLabel", "latestFailedGateHint"],
            NextCommand = "archlucid config lint --profile production-like-hosted-pilot && review AzureOpenAI appsettings",
        },
        new SupportBundleTriageDrillScenario
        {
            DrillId = "proof-packet-hold",
            Title = "Proof packet sponsor handoff is HOLD",
            LikelyCause = "PilotStrict, ROI source catalog, or data-consistency proof failed during collect-first-pilot-proof.ps1.",
            EvidencePath = "first-pilot-command-center.md + go-no-go-summary.json",
            CorrelationFields = ["run.runId", "run.manifestVersion", "artifactIds"],
            NextCommand = "./scripts/FirstPilotSupportNextStep.ps1 -FindingName proof-packet-hold",
        },
        new SupportBundleTriageDrillScenario
        {
            DrillId = "missing-artifact-after-commit",
            Title = "Expected artifact missing after commit",
            LikelyCause = "Commit succeeded but artifact synthesis or blob storage write failed; check audit timeline.",
            EvidencePath = "triage-index.md → artifactIds + recentAuditEventIds",
            CorrelationFields = ["run.runId", "run.otelTraceId", "artifactIds", "recentAuditEventIds"],
            NextCommand = "GET /v1/authority/runs/{runId}/pipeline-timeline && archlucid support-bundle --run-id {runId} --zip",
        },
    ];

    public static SupportBundleTriageDrillScenario? TryGet(string drillId)
    {
        if (string.IsNullOrWhiteSpace(drillId))
            return null;

        foreach (SupportBundleTriageDrillScenario scenario in All)
        {
            if (string.Equals(scenario.DrillId, drillId, StringComparison.OrdinalIgnoreCase))
                return scenario;
        }

        return null;
    }

    public static string ToMarkdown()
    {
        System.Text.StringBuilder builder = new();
        builder.AppendLine("# Support bundle triage drills");
        builder.AppendLine();
        builder.AppendLine("Synthetic rehearsal scenarios — identifiers only, no secrets.");
        builder.AppendLine();

        foreach (SupportBundleTriageDrillScenario scenario in All)
        {
            builder.AppendLine($"## {scenario.DrillId}: {scenario.Title}");
            builder.AppendLine();
            builder.AppendLine($"- **Likely cause:** {scenario.LikelyCause}");
            builder.AppendLine($"- **Evidence path:** {scenario.EvidencePath}");
            builder.AppendLine($"- **Correlation fields:** {string.Join(", ", scenario.CorrelationFields)}");
            builder.AppendLine($"- **Next command:** `{scenario.NextCommand}`");
            builder.AppendLine();
        }

        return builder.ToString();
    }
}
