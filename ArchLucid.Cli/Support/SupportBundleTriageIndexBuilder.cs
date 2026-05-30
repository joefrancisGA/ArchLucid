using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Builds a redacted triage index correlating run, health, audit, and artifact identifiers.
/// </summary>
public static class SupportBundleTriageIndexBuilder
{
    public const string JsonFileName = "triage-index.json";

    public const string MarkdownFileName = "triage-index.md";

    /// <summary>
    ///     Builds the index from an already-collected bundle payload and optional run correlation.
    /// </summary>
    public static async Task<SupportBundleTriageIndexDocument> BuildAsync(
        ArchLucidApiClient client,
        SupportBundlePayload payload,
        string? runId,
        bool redactionManifestPassApplied = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(payload);

        string generatedUtc = TimeProvider.System.UtcNowDateTime().ToString("O", CultureInfo.InvariantCulture);

        SupportBundleTriageRunSection? runSection = null;
        IReadOnlyList<string> artifactIds = [];
        IReadOnlyList<string> auditIds = [];
        string? structuralExecutionModeLabel = null;

        if (!string.IsNullOrWhiteSpace(runId))
        {
            ArchLucidApiClient.GetRunResult? detail = await client.GetRunAsync(runId, cancellationToken);

            if (detail is not null)
            {
                ArchLucidApiClient.RunInfo run = detail.Run;

                runSection = new SupportBundleTriageRunSection
                {
                    RunId = run.RunId,
                    RequestId = run.RequestId,
                    Status = run.Status.ToString(),
                    ManifestVersion = run.CurrentManifestVersion,
                    OtelTraceId = run.OtelTraceId
                };

                structuralExecutionModeLabel = FormatStructuralExecutionMode(run.StructuralExecutionMode, run.RealModeFellBackToSimulator);

                artifactIds = await client.TryListArtifactIdsForRunAsync(run.RunId, cancellationToken);
            }
        }

        int take = Math.Min(PaginationDefaults.MaxListingTake, 25);
        auditIds = await client.TryFetchRecentAuditEventIdsAsync(runId, take, cancellationToken);

        List<string> notes =
        [
            "Identifiers only — no secrets, prompts, or evidence bodies.",
            "Retrieval grounding trace ids are not captured unless a future diagnostics API exposes them."
        ];

        if (runSection is null && !string.IsNullOrWhiteSpace(runId))
        {
            notes.Add($"Run '{runId}' was not returned by the API (check scope and credentials).");
        }

        return new SupportBundleTriageIndexDocument
        {
            GeneratedUtc = generatedUtc,
            ApiBaseUrlRedacted = payload.ConfigSummary.ApiBaseUrlRedacted,
            Scope = ReadScopeFromEnvironment(),
            Run = runSection,
            Health = new SupportBundleTriageHealthSection
            {
                LiveHttpStatus = payload.Health.Live.HttpStatus,
                ReadyHttpStatus = payload.Health.Ready.HttpStatus,
                CombinedHttpStatus = payload.Health.Combined.HttpStatus
            },
            ConfigModeSummary = payload.ConfigSummary.HostAuthModeSummary,
            HostVersionSummary = SummarizeVersion(payload.Build.ApiVersionJson, payload.Build.ApiVersionError),
            RedactionManifestStatus = redactionManifestPassApplied ? "PASS" : "NOT_APPLIED",
            StructuralExecutionModeLabel = structuralExecutionModeLabel,
            LatestFailedGateHint = SummarizeLatestFailedGate(payload),
            RecentAuditEventIds = auditIds,
            ArtifactIds = artifactIds,
            RetrievalGroundingTraceIds = [],
            Notes = notes
        };
    }

    public static string ToMarkdown(SupportBundleTriageIndexDocument index)
    {
        ArgumentNullException.ThrowIfNull(index);

        StringBuilder sb = new();

        sb.AppendLine("# Support bundle triage index");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {index.GeneratedUtc}");
        sb.AppendLine($"API base (redacted): {index.ApiBaseUrlRedacted}");
        sb.AppendLine($"Config mode: {index.ConfigModeSummary}");
        sb.AppendLine($"Host version: {index.HostVersionSummary}");
        sb.AppendLine($"Redaction manifest: {index.RedactionManifestStatus}");
        sb.AppendLine($"Structural execution mode: {OrNotCaptured(index.StructuralExecutionModeLabel)}");

        if (!string.IsNullOrWhiteSpace(index.LatestFailedGateHint))
        {
            sb.AppendLine($"Latest failed gate hint: {index.LatestFailedGateHint}");
        }

        sb.AppendLine();
        sb.AppendLine("## Scope");
        sb.AppendLine($"- tenantId: {OrNotCaptured(index.Scope.TenantId)}");
        sb.AppendLine($"- workspaceId: {OrNotCaptured(index.Scope.WorkspaceId)}");
        sb.AppendLine($"- projectId: {OrNotCaptured(index.Scope.ProjectId)}");
        sb.AppendLine();
        sb.AppendLine("## Health");
        sb.AppendLine($"- /health/live: HTTP {index.Health.LiveHttpStatus}");
        sb.AppendLine($"- /health/ready: HTTP {index.Health.ReadyHttpStatus}");
        sb.AppendLine($"- /health/diagnostics: HTTP {index.Health.CombinedHttpStatus}");
        sb.AppendLine();

        if (index.Run is not null)
        {
            sb.AppendLine("## Run");
            sb.AppendLine($"- runId: {index.Run.RunId}");
            sb.AppendLine($"- requestId: {index.Run.RequestId}");
            sb.AppendLine($"- status: {index.Run.Status}");
            sb.AppendLine($"- manifestVersion: {OrNotCaptured(index.Run.ManifestVersion)}");
            sb.AppendLine($"- otelTraceId: {OrNotCaptured(index.Run.OtelTraceId)}");
            sb.AppendLine();
        }

        AppendIdList(sb, "Recent audit event ids", index.RecentAuditEventIds);
        AppendIdList(sb, "Artifact ids", index.ArtifactIds);
        AppendIdList(sb, "Retrieval grounding trace ids", index.RetrievalGroundingTraceIds);

        sb.AppendLine("## Notes");

        foreach (string note in index.Notes)
        {
            sb.AppendLine($"- {note}");
        }

        sb.AppendLine();
        sb.AppendLine("Open next-steps.json and health.json to confirm probe-derived hints.");

        return sb.ToString();
    }

    private static SupportBundleTriageScopeSection ReadScopeFromEnvironment()
    {
        return new SupportBundleTriageScopeSection
        {
            TenantId = ReadOptionalEnv("ARCHLUCID_TENANT_ID") ?? ReadOptionalEnv("X_TENANT_ID"),
            WorkspaceId = ReadOptionalEnv("ARCHLUCID_WORKSPACE_ID") ?? ReadOptionalEnv("X_WORKSPACE_ID"),
            ProjectId = ReadOptionalEnv("ARCHLUCID_AUTHORITY_PROJECT") ?? ReadOptionalEnv("ARCHLUCID_PROJECT_ID")
        };
    }

    private static string? ReadOptionalEnv(string name)
    {
        string? value = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    private static string SummarizeVersion(string? versionJson, string? versionError)
    {
        if (!string.IsNullOrWhiteSpace(versionError))
            return "unavailable (" + versionError + ")";

        if (string.IsNullOrWhiteSpace(versionJson))
            return "(not captured)";

        if (versionJson.Contains("informationalVersion", StringComparison.OrdinalIgnoreCase))
            return "(see build.json — informationalVersion present)";

        return "(version JSON present)";
    }

    private static void AppendIdList(StringBuilder sb, string heading, IReadOnlyList<string> ids)
    {
        sb.AppendLine($"## {heading}");

        if (ids.Count == 0)
        {
            sb.AppendLine("- (none captured — check ReadAuthority and scope headers)");
            sb.AppendLine();

            return;
        }

        foreach (string id in ids)
        {
            sb.AppendLine($"- {id}");
        }

        sb.AppendLine();
    }

    private static string OrNotCaptured(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? "(not captured)" : value;
    }

    private static string? FormatStructuralExecutionMode(int? modeValue, bool? realModeFellBackToSimulator)
    {
        if (modeValue is null || !Enum.IsDefined(typeof(StructuralExecutionMode), modeValue.Value))
        {
            if (realModeFellBackToSimulator == true)
                return "Fallback";

            return null;
        }

        return ((StructuralExecutionMode)modeValue.Value).ToString();
    }

    private static string? SummarizeLatestFailedGate(SupportBundlePayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        if (payload.Health.Ready.HttpStatus is >= 400 and < 600)
            return $"/health/ready returned HTTP {payload.Health.Ready.HttpStatus.ToString(CultureInfo.InvariantCulture)}";

        if (payload.Health.Combined.HttpStatus is >= 400 and < 600)
            return $"/health/diagnostics returned HTTP {payload.Health.Combined.HttpStatus.ToString(CultureInfo.InvariantCulture)}";

        SupportBundleValidateConfigAlert? blocking = payload.ConfigSummary.ValidateConfigAlerts
            .FirstOrDefault(a => string.Equals(a.Severity, "Error", StringComparison.OrdinalIgnoreCase));

        if (blocking is not null)
            return $"Config validate alert [{blocking.Category}]: {blocking.Check}";

        return null;
    }
}
