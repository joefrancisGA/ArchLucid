namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Outcome of <see cref="IDataConsistencyRemediationExecutor.ExecuteAsync" /> (dry-run candidate count or
///     execute deleted id list).
/// </summary>
public sealed record DataConsistencyRemediationResult(
    bool DryRun,
    int RowCount,
    IReadOnlyList<string> RemediatedIds);
