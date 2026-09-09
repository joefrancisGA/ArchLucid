using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed class FindingsDecisionGradeFusionStage : IFindingsDecisionGradeFusionStage
{
    public Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        if (context.Snapshot is null)
        {
            throw new InvalidOperationException("Findings snapshot was not built before decision-grade fusion stage.");
        }

        IReadOnlyList<Finding> fusionFindings =
            DecisionGradeFusionApplicator.Apply(context.Snapshot.Findings);

        if (fusionFindings.Count == 0)
        {
            return Task.CompletedTask;
        }

        context.Snapshot.Findings.AddRange(fusionFindings);
        DecisionGradeFusionConstituentDemoter.DemoteFusedConstituents(
            context.Snapshot.Findings,
            fusionFindings);
        context.SuccessfulEngineTypes.Add(DecisionGradeFusionApplicator.EngineType);

        return Task.CompletedTask;
    }
}
