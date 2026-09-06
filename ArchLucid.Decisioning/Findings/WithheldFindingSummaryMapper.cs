using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Maps stripped agent findings and merge drops to <see cref="WithheldFindingSummary" /> rows (DR-02).</summary>
public static class WithheldFindingSummaryMapper
{
    private const int TitleMaxLength = 160;

    public static WithheldFindingSummary FromStrippedAgentFinding(ArchitectureFinding finding, AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(result);

        string findingId = string.IsNullOrWhiteSpace(finding.FindingId)
            ? Guid.NewGuid().ToString("N")
            : finding.FindingId.Trim();

        return new WithheldFindingSummary
        {
            WithheldFindingId = $"emission-{result.ResultId}-{findingId}",
            Reason = WithheldFindingReasons.ProseOnlyEmission,
            OriginAgentType = result.AgentType.ToString(),
            OriginEngineType = $"AgentArchitectureFinding-{result.AgentType}",
            Title = TruncateTitle(finding.Message),
            TraceTargetId = result.ResultId,
        };
    }

    public static WithheldFindingSummary FromMergeDroppedFinding(
        Finding dropped,
        string conflictFindingId)
    {
        ArgumentNullException.ThrowIfNull(dropped);
        ArgumentException.ThrowIfNullOrWhiteSpace(conflictFindingId);

        string findingId = string.IsNullOrWhiteSpace(dropped.FindingId)
            ? Guid.NewGuid().ToString("N")
            : dropped.FindingId.Trim();

        return new WithheldFindingSummary
        {
            WithheldFindingId = $"merge-drop-{findingId}",
            Reason = WithheldFindingReasons.MergeConflictDropped,
            OriginEngineType = dropped.EngineType ?? string.Empty,
            Title = TruncateTitle(dropped.Title),
            ConflictFindingId = conflictFindingId,
        };
    }

    public static WithheldFindingSummary FromAdvisoryEngineFailure(FindingEngineFailure failure)
    {
        ArgumentNullException.ThrowIfNull(failure);

        string engineType = failure.EngineType.Trim();
        string category = failure.Category.Trim();
        string withheldFindingId = $"engine-failure-{engineType}-{category}".ToLowerInvariant();

        return new WithheldFindingSummary
        {
            WithheldFindingId = withheldFindingId,
            Reason = WithheldFindingReasons.EngineFailureAdvisory,
            OriginEngineType = engineType,
            Title = TruncateTitle(
                $"This engine did not produce findings — the package is incomplete for {category}."),
        };
    }

    public static WithheldFindingSummary FromQuarantinedComplianceTagProse(
        ArchitectureFinding finding,
        AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(result);

        string findingId = string.IsNullOrWhiteSpace(finding.FindingId)
            ? Guid.NewGuid().ToString("N")
            : finding.FindingId.Trim();

        return new WithheldFindingSummary
        {
            WithheldFindingId = $"compliance-tag-prose-{result.ResultId}-{findingId}",
            Reason = WithheldFindingReasons.ComplianceTagFromProse,
            OriginAgentType = result.AgentType.ToString(),
            OriginEngineType = $"AgentArchitectureFinding-{result.AgentType}",
            Title = TruncateTitle(finding.Message),
            TraceTargetId = result.ResultId,
        };
    }

    private static string TruncateTitle(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Withheld finding";
        }

        string trimmed = raw.Trim();

        if (trimmed.Length <= TitleMaxLength)
        {
            return trimmed;
        }

        return trimmed[..TitleMaxLength].TrimEnd() + "…";
    }
}
