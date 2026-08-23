namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Shared execute/dry-run outcome from <see cref="DataConsistencyRemediationExecutor" />.
/// </summary>
public sealed record DataConsistencyRemediationOutcome(
    bool DryRun,
    int RowCount,
    IReadOnlyList<string> DeletedIds);
