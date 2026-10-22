namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Shared guard → clamp → SELECT → dry-run → transactional DELETE → audit pipeline for data-consistency remediation.
/// </summary>
public interface IDataConsistencyRemediationExecutor
{
    Task<DataConsistencyRemediationResult> ExecuteAsync(
        DataConsistencyRemediationDefinition definition,
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default);
}
