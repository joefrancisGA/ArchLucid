using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Wave-3 suggestion 27: embed specialist conclusions into authority findings with ADR 0063 merge keys.
/// </summary>
public static class SpecialistFindingAuthorityEmbedding
{
    public static List<Finding> Embed(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<Finding> embedded = [];

        foreach (Finding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            {
                finding.PolicyRuleId = BuildFallbackPolicyRuleId(finding);
            }

            finding.FindingId = FindingSnapshotMergeKey.FromFinding(finding);
            embedded.Add(finding);
        }

        return embedded;
    }

    private static string BuildFallbackPolicyRuleId(Finding finding)
    {
        string category = string.IsNullOrWhiteSpace(finding.Category)
            ? "architecture-intelligence"
            : finding.Category.ToLowerInvariant();

        return $"architecture-intelligence.{category}.embedded";
    }
}
