namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Findings pipeline merge, policy violations, human review, density gate, and savings stage.</summary>
public interface IFindingsMergeAndGateStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
