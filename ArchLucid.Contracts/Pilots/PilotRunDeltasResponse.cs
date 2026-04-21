using ArchLucid.Contracts.Explanation;

namespace ArchLucid.Contracts.Pilots;

/// <summary>
/// JSON projection of proof-of-ROI deltas for a single run (<c>GET /v1/pilots/runs/.../pilot-run-deltas</c>).
/// </summary>
public sealed class PilotRunDeltasResponse
{
    public double? TimeToCommittedManifestTotalSeconds
    {
        get; init;
    }

    public DateTime? ManifestCommittedUtc
    {
        get; init;
    }

    public DateTime RunCreatedUtc
    {
        get; init;
    }

    public IReadOnlyList<PilotRunDeltaSeverityCountResponse> FindingsBySeverity
    {
        get; init;
    } = [];

    public int AuditRowCount
    {
        get; init;
    }

    public bool AuditRowCountTruncated
    {
        get; init;
    }

    public int LlmCallCount
    {
        get; init;
    }

    public string? TopFindingSeverity
    {
        get; init;
    }

    public string? TopFindingId
    {
        get; init;
    }

    public FindingEvidenceChainResponse? TopFindingEvidenceChain
    {
        get; init;
    }

    public bool IsDemoTenant
    {
        get; init;
    }
}

/// <summary>One severity bucket from <see cref="PilotRunDeltasResponse.FindingsBySeverity"/>.</summary>
public sealed class PilotRunDeltaSeverityCountResponse
{
    public string Severity
    {
        get; init;
    } = string.Empty;

    public int Count
    {
        get; init;
    }
}
