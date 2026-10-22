namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Findings pipeline engine adapter partition, parallel invoke, and portfolio recurrence defer stage.</summary>
public interface IFindingsEngineInvokeStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
