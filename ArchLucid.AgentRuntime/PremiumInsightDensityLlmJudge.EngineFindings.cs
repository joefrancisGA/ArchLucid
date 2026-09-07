using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

public sealed partial class PremiumInsightDensityLlmJudge
{
    private async Task JudgeOneEngineFindingAsync(
        Finding finding,
        IAgentCompletionClient completionClient,
        string systemPrompt,
        CancellationToken cancellationToken)
    {
        string userPrompt = BuildEngineFindingUserPrompt(finding);
        HashSet<string> allowedRefs = InsightDensityEngineFindingEvidenceSummary.CollectAllowedEvidenceRefs(finding);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken);

            InsightDensityLlmJudgment? judgment = InsightDensityLlmJudgmentParser.TryParse(rawJson, finding.FindingId);

            if (judgment is null)
            {
                _logger.LogDebug(
                    "Insight-density LLM judge returned unparsable output for engine finding {FindingId}.",
                    finding.FindingId);

                return;
            }

            if (!InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithfulForEngineFinding(
                    judgment,
                    finding,
                    allowedRefs))
            {
                _logger.LogWarning(
                    "Insight-density LLM judge output failed faithfulness for engine finding {FindingId}; retaining Phase 1 output.",
                    finding.FindingId);

                return;
            }

            FindingInsightDensityLlmJudgmentApplicator.ApplyEnrichmentToFinding(finding, judgment);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Insight-density LLM judge failed for engine finding {FindingId}; retaining Phase 1 gate output.",
                finding.FindingId);
        }
    }

    private static bool IsEngineJudgeCandidate(Finding finding)
    {
        if (finding.Treatment != FindingTreatment.Promote)
        {
            return false;
        }

        return finding.Classification is null
            || finding.Classification == FindingClassification.DecisionGradeFinding;
    }

    private static (IReadOnlyList<Finding> Judged, int SkippedByCap) SelectJudgedCandidates(
        IReadOnlyList<Finding> candidates,
        int maxJudgedFindingsPerSnapshot)
    {
        List<Finding> ordered = candidates
            .OrderByDescending(static finding => InsightDensityPreferredEngineTypes.IsPreferred(finding.EngineType))
            .ThenByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.InsightDensityScore ?? int.MaxValue)
            .ThenBy(static finding => finding.FindingId, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count <= maxJudgedFindingsPerSnapshot)
        {
            return (ordered, 0);
        }

        int skipped = ordered.Count - maxJudgedFindingsPerSnapshot;

        return (ordered.Take(maxJudgedFindingsPerSnapshot).ToList(), skipped);
    }
}
