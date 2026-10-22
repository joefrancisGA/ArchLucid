namespace ArchLucid.Persistence.Archival;

/// <summary>
///     Applies retention cutoffs to persistence stores (soft <c>ArchivedUtc</c> flags) and optional SQL hard-delete of
///     archived agent execution traces.
/// </summary>
public interface IDataArchivalCoordinator
{
    /// <summary>Runs one archival pass using the supplied effective options snapshot.</summary>
    Task RunOnceAsync(DataArchivalOptions options, CancellationToken ct);
}
