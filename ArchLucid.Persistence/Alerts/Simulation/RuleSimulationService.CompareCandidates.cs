
namespace ArchLucid.Persistence.Alerts.Simulation;

public sealed partial class RuleSimulationService
{
    /// <inheritdoc />
    public async Task<RuleCandidateComparisonResult> CompareCandidatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        RuleCandidateComparisonRequest request,
        CancellationToken ct)
    {
        IReadOnlyList<AlertEvaluationContext> contexts = await contextProvider.GetContextsAsync(
            tenantId, workspaceId, projectId, null, null, request.RecentRunCount, request.RunProjectSlug, ct);

        RuleSimulationResult candidateA;
        RuleSimulationResult candidateB;

        if (string.Equals(request.RuleKind, RuleKindSimple, StringComparison.OrdinalIgnoreCase))
        {
            candidateA = await EvaluateContextsAsync(
                new RuleSimulationRequest
                {
                    RuleKind = RuleKindSimple,
                    SimpleRule = request.CandidateASimpleRule,
                },
                contexts,
                ct);

            candidateB = await EvaluateContextsAsync(
                new RuleSimulationRequest
                {
                    RuleKind = RuleKindSimple,
                    SimpleRule = request.CandidateBSimpleRule,
                },
                contexts,
                ct);
        }
        else
        {
            candidateA = await EvaluateContextsAsync(
                new RuleSimulationRequest
                {
                    RuleKind = RuleKindComposite,
                    CompositeRule = request.CandidateACompositeRule,
                },
                contexts,
                ct);

            candidateB = await EvaluateContextsAsync(
                new RuleSimulationRequest
                {
                    RuleKind = RuleKindComposite,
                    CompositeRule = request.CandidateBCompositeRule,
                },
                contexts,
                ct);
        }

        RuleCandidateComparisonResult result = new()
        {
            CandidateA = candidateA,
            CandidateB = candidateB,
        };

        result.SummaryNotes.Add($"Candidate A would create {candidateA.WouldCreateCount} alert(s).");
        result.SummaryNotes.Add($"Candidate B would create {candidateB.WouldCreateCount} alert(s).");
        result.SummaryNotes.Add($"Candidate A would suppress {candidateA.WouldSuppressCount} outcome(s).");
        result.SummaryNotes.Add($"Candidate B would suppress {candidateB.WouldSuppressCount} outcome(s).");

        return result;
    }
}
