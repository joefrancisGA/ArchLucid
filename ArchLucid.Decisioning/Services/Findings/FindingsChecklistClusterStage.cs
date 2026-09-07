using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed class FindingsChecklistClusterStage : IFindingsChecklistClusterStage
{
    public Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        if (context.Snapshot is null)
        {
            throw new InvalidOperationException("Findings snapshot was not built before checklist cluster stage.");
        }

        IReadOnlyList<Finding> synthesisFindings =
            ChecklistClusterSynthesisApplicator.Apply(context.Snapshot.Findings);

        if (synthesisFindings.Count == 0)
        {
            return Task.CompletedTask;
        }

        context.Snapshot.Findings.AddRange(synthesisFindings);
        context.SuccessfulEngineTypes.Add(ChecklistClusterSynthesisApplicator.EngineType);

        return Task.CompletedTask;
    }
}
