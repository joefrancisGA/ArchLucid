
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
        RuleSimulationResult candidateA;
        RuleSimulationResult candidateB;

        if (string.Equals(request.RuleKind, RuleKindSimple, StringComparison.OrdinalIgnoreCase))
        {
            candidateA = await SimulateAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    new RuleSimulationRequest
                    {
                        RuleKind = RuleKindSimple,
                        SimpleRule = request.CandidateASimpleRule,
                        RecentRunCount = request.RecentRunCount,
                        RunProjectSlug = request.RunProjectSlug,
                    },
                    ct)
                ;

            candidateB = await SimulateAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    new RuleSimulationRequest
                    {
                        RuleKind = RuleKindSimple,
                        SimpleRule = request.CandidateBSimpleRule,
                        RecentRunCount = request.RecentRunCount,
                        RunProjectSlug = request.RunProjectSlug,
                    },
                    ct)
                ;
        }
        else
        {
            candidateA = await SimulateAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    new RuleSimulationRequest
                    {
                        RuleKind = RuleKindComposite,
                        CompositeRule = request.CandidateACompositeRule,
                        RecentRunCount = request.RecentRunCount,
                        RunProjectSlug = request.RunProjectSlug,
                    },
                    ct)
                ;

            candidateB = await SimulateAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    new RuleSimulationRequest
                    {
                        RuleKind = RuleKindComposite,
                        CompositeRule = request.CandidateBCompositeRule,
                        RecentRunCount = request.RecentRunCount,
                        RunProjectSlug = request.RunProjectSlug,
                    },
                    ct)
                ;
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
