namespace ArchLucid.Application.Architecture.Execute;

/// <summary>
///     Emergency-disable checks, request validation, identity-abuse gating, and local guard admission.
/// </summary>
public interface IQuickScanExecutionPreExecuteStage
{
    Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken);
}
