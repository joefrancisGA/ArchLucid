namespace ArchLucid.Application.Architecture.Execute;

/// <summary>
///     Usage persistence and durable audit logging after scan execution.
/// </summary>
public interface IQuickScanExecutionUsageAndAuditStage
{
    Task RecordSuccessAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken);

    Task RecordExecutionFailureAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken);
}
