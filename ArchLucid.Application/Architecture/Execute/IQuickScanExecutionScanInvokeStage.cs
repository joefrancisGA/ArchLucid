namespace ArchLucid.Application.Architecture.Execute;

/// <summary>
///     LLM scan invocation, per-scan cost enforcement, and success telemetry.
/// </summary>
public interface IQuickScanExecutionScanInvokeStage
{
    Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken);
}
