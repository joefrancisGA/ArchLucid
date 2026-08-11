namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Reconciles expired execute ownership leases into honest terminal run statuses (TB-943).</summary>
public interface IRunExecuteOwnershipReconciliationService
{
    Task<RunExecuteOwnershipReconciliationReport> ReconcileExpiredLeasesAsync(CancellationToken cancellationToken);
}

/// <summary>Outcome of one reconciliation pass.</summary>
public sealed record RunExecuteOwnershipReconciliationReport(
    int ExpiredLeaseCount,
    int ReconciledCount,
    int SkippedCount);
