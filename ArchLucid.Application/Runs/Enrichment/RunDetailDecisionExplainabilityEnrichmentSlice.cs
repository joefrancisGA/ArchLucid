using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailDecisionExplainabilityEnrichmentSlice(
    IDecisionNodeRepository decisionNodeRepository) : IRunDetailEnrichmentSlice
{
    private readonly IDecisionNodeRepository _decisionNodeRepository =
        decisionNodeRepository ?? throw new ArgumentNullException(nameof(decisionNodeRepository));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        string runHex = detail.Run.RunId.ToString("N");

        IReadOnlyList<DecisionNodeRecord> coordinatorNodes =
            await _decisionNodeRepository.GetByRunIdAsync(runHex, cancellationToken).ConfigureAwait(false);

        RunDecisionExplainabilityDto built = RunDecisionExplainabilityBuilder.Build(detail, coordinatorNodes);

        if (built.AuthorityRuleAudit is null
            && built.ManifestDecisions.Count == 0
            && built.CoordinatorDecisionNodes.Count == 0
            && built.FindingEngineFailures.Count == 0
            && built.ManifestHonestyWarnings.Count == 0)
        {
            return;
        }

        detail.DecisionExplainability = built;
    }
}
