namespace ArchLucid.Application.Runs.TechnologyLedger;

/// <summary>
///     Thrown when a Technology Ledger entry id does not exist for the requested run. Maps to HTTP 404.
/// </summary>
public sealed class TechnologyLedgerEntryNotFoundException(string runId, string entryId)
    : Exception($"Technology Ledger entry '{entryId}' was not found for run '{runId}'.")
{
    public string RunId { get; } = runId ?? throw new ArgumentNullException(nameof(runId));

    public string EntryId { get; } = entryId ?? throw new ArgumentNullException(nameof(entryId));
}
