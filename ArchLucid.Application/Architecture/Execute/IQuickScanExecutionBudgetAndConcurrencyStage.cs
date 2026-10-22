namespace ArchLucid.Application.Architecture.Execute;

/// <summary>
///     Pre-execution cost reservation, distributed concurrency admission, and global budget reservation.
/// </summary>
public interface IQuickScanExecutionBudgetAndConcurrencyStage
{
    Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken);
}
