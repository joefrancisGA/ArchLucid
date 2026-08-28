using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

public sealed partial class PremiumInsightDensityLlmJudge
{
    private async Task JudgeOneFindingAsync(
        ArchitectureFinding finding,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        IAgentCompletionClient completionClient,
        string systemPrompt,
        CancellationToken cancellationToken)
    {
        string userPrompt = BuildUserPrompt(finding, request, evidence);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken);

            InsightDensityLlmJudgment? judgment = InsightDensityLlmJudgmentParser.TryParse(rawJson, finding.FindingId);

            if (judgment is null)
            {
                _logger.LogDebug(
                    "Insight-density LLM judge returned unparsable output for finding {FindingId}.",
                    finding.FindingId);

                return;
            }

            if (!InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithful(judgment, finding, evidence))
            {
                _logger.LogDebug(
                    "Insight-density LLM judge output failed faithfulness for finding {FindingId}; demoting.",
                    finding.FindingId);

                DemoteForUnfaithfulJudgment(finding);

                return;
            }

            FindingInsightDensityLlmJudgmentApplicator.ApplyToArchitectureFinding(finding, judgment);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Insight-density LLM judge failed for finding {FindingId}; retaining Phase 1 gate output.",
                finding.FindingId);
        }
    }

    private static (IReadOnlyList<ArchitectureFinding> Judged, int SkippedByCap) SelectJudgedArchitectureCandidates(
        IReadOnlyList<ArchitectureFinding> candidates,
        int maxJudgedFindingsPerSnapshot)
    {
        List<ArchitectureFinding> ordered = candidates
            .OrderByDescending(static finding => finding.Severity)
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

    private static void DemoteForUnfaithfulJudgment(ArchitectureFinding finding)
    {
        finding.Treatment = FindingTreatment.DemoteToChecklist;
        finding.Classification = FindingClassification.ChecklistCoverage;
    }
}
