using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Redacted correlation index for support bundles (<c>triage-index.json</c> / <c>triage-index.md</c>).
/// </summary>
public sealed class SupportBundleTriageIndexDocument
{
    [JsonPropertyName("schema")]
    public string Schema { get; init; } = "archlucid.support-bundle-triage-index.v1";

    [JsonPropertyName("generatedUtc")]
    public string GeneratedUtc { get; init; } = string.Empty;

    [JsonPropertyName("apiBaseUrlRedacted")]
    public string ApiBaseUrlRedacted { get; init; } = string.Empty;

    [JsonPropertyName("scope")]
    public SupportBundleTriageScopeSection Scope { get; init; } = new();

    [JsonPropertyName("run")]
    public SupportBundleTriageRunSection? Run { get; init; }

    [JsonPropertyName("health")]
    public SupportBundleTriageHealthSection Health { get; init; } = new();

    [JsonPropertyName("configModeSummary")]
    public string ConfigModeSummary { get; init; } = string.Empty;

    [JsonPropertyName("hostVersionSummary")]
    public string HostVersionSummary { get; init; } = string.Empty;

    [JsonPropertyName("redactionManifestStatus")]
    public string RedactionManifestStatus { get; init; } = "NOT_CAPTURED";

    [JsonPropertyName("structuralExecutionModeLabel")]
    public string? StructuralExecutionModeLabel { get; init; }

    /// <summary>CG-092 — CG-019 execute door stamp summary when <c>--run-id</c> is supplied (no secrets).</summary>
    [JsonPropertyName("careerPosture")]
    public SupportBundleTriageCareerPostureSection? CareerPosture { get; init; }

    [JsonPropertyName("latestFailedGateHint")]
    public string? LatestFailedGateHint { get; init; }

    [JsonPropertyName("recentAuditEventIds")]
    public IReadOnlyList<string> RecentAuditEventIds { get; init; } = [];

    [JsonPropertyName("artifactIds")]
    public IReadOnlyList<string> ArtifactIds { get; init; } = [];

    [JsonPropertyName("retrievalGroundingTraceIds")]
    public IReadOnlyList<string> RetrievalGroundingTraceIds { get; init; } = [];

    [JsonPropertyName("notes")]
    public IReadOnlyList<string> Notes { get; init; } = [];
}

public sealed class SupportBundleTriageScopeSection
{
    [JsonPropertyName("tenantId")]
    public string? TenantId { get; init; }

    [JsonPropertyName("workspaceId")]
    public string? WorkspaceId { get; init; }

    [JsonPropertyName("projectId")]
    public string? ProjectId { get; init; }
}

public sealed class SupportBundleTriageRunSection
{
    [JsonPropertyName("runId")]
    public string RunId { get; init; } = string.Empty;

    [JsonPropertyName("requestId")]
    public string RequestId { get; init; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("manifestVersion")]
    public string? ManifestVersion { get; init; }

    [JsonPropertyName("otelTraceId")]
    public string? OtelTraceId { get; init; }

    /// <summary>CG-019 stamp capture time (UTC ISO-8601). Null on legacy rows that never executed.</summary>
    [JsonPropertyName("executePostureCapturedUtc")]
    public string? ExecutePostureCapturedUtc { get; init; }
}

/// <summary>CG-092 — redacted execute posture for on-call triage (mode + door only).</summary>
public sealed class SupportBundleTriageCareerPostureSection
{
    [JsonPropertyName("workingCareerRehearsalDoor")]
    public string WorkingCareerRehearsalDoor { get; init; } = string.Empty;

    [JsonPropertyName("careerPostureLabel")]
    public string CareerPostureLabel { get; init; } = string.Empty;

    [JsonPropertyName("rehearsalIncomplete")]
    public bool RehearsalIncomplete { get; init; }

    [JsonPropertyName("careerBlocked")]
    public bool CareerBlocked { get; init; }
}

public sealed class SupportBundleTriageHealthSection
{
    [JsonPropertyName("liveHttpStatus")]
    public int LiveHttpStatus { get; init; }

    [JsonPropertyName("readyHttpStatus")]
    public int ReadyHttpStatus { get; init; }

    [JsonPropertyName("combinedHttpStatus")]
    public int CombinedHttpStatus { get; init; }
}
