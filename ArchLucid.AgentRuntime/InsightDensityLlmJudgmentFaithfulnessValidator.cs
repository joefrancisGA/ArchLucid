using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Ensures LLM judge output cannot cite evidence outside the candidate finding or uploaded package.
/// </summary>
public static class InsightDensityLlmJudgmentFaithfulnessValidator
{
    public static bool IsFaithful(
        InsightDensityLlmJudgment judgment,
        ArchitectureFinding finding,
        AgentEvidencePackage evidence)
    {
        ArgumentNullException.ThrowIfNull(judgment);
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(evidence);

        if (judgment.EvidenceRefs.Count == 0)
        {
            return CriticFindingEvidenceCitationRules.HasConcreteEvidenceCitation(finding);
        }

        HashSet<string> allowedRefs = new(StringComparer.OrdinalIgnoreCase);

        foreach (string reference in finding.EvidenceRefs)
        {
            if (!string.IsNullOrWhiteSpace(reference))
            {
                allowedRefs.Add(reference.Trim());
            }
        }

        AgentEvidenceGroundingIndex.Index index = AgentEvidenceGroundingIndex.Build(evidence);

        foreach (string reference in judgment.EvidenceRefs)
        {
            if (allowedRefs.Contains(reference))
            {
                continue;
            }

            if (string.IsNullOrEmpty(index.ResolveRefsBlob([reference])))
            {
                return false;
            }
        }

        return true;
    }
}
