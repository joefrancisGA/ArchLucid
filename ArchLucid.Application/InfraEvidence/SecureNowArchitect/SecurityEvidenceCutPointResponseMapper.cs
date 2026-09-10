using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public static class SecurityEvidenceCutPointResponseMapper
{
    public static SecurityEvidenceCutPointSummaryResponse MapSummary(SecurityEvidenceCutPointRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        IReadOnlyList<Guid> collapsedPathIds = ParseGuidList(record.CollapsedPathIdsJson);
        IReadOnlyList<string> evidenceReferences = ParseStringList(record.EvidenceReferencesJson);

        return new SecurityEvidenceCutPointSummaryResponse
        {
            CutPointId = record.CutPointId,
            CutOrder = record.CutOrder,
            CutKind = record.CutKind.ToString(),
            FromNodeLabel = record.FromNodeId is null
                ? null
                : SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(record.FromNodeId),
            ToNodeLabel = record.ToNodeId is null
                ? null
                : SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(record.ToNodeId),
            EdgeType = record.EdgeType,
            PathsCollapsedCount = record.PathsCollapsedCount,
            OperationalCostClass = record.OperationalCostClass.ToString(),
            LeverageScore = record.LeverageScore,
            CollapsedPathIds = collapsedPathIds,
            EvidenceReferences = evidenceReferences,
            SuggestedPatternKey = record.SuggestedPatternKey,
            ExplanationSummary = BuildExplanationSummary(record),
        };
    }

    private static string BuildExplanationSummary(SecurityEvidenceCutPointRecord record)
    {
        string target = record.CutKind == SecurityEvidenceCutPointKind.Edge
            ? $"edge {record.EdgeType} from {SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(record.FromNodeId ?? "unknown")} to {SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(record.ToNodeId ?? "unknown")}"
            : $"node {SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(record.FromNodeId ?? "unknown")}";

        return $"{SecurityEvidenceCutPointConstants.RuleVersion}: removing {target} collapses {record.PathsCollapsedCount} ranked path(s) "
            + $"with operational cost {record.OperationalCostClass} (leverage {record.LeverageScore:0.###}).";
    }

    private static IReadOnlyList<Guid> ParseGuidList(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IReadOnlyList<string> ParseStringList(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
