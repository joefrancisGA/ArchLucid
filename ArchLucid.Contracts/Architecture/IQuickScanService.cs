namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Port for executing lightweight, single-pass architecture scans without the full knowledge graph.
/// </summary>
public interface IQuickScanService
{
    /// <summary>
    ///     Runs a quick scan on in-memory file contents (path → text).
    /// </summary>
    Task<QuickScanResult> ScanAsync(IReadOnlyDictionary<string, string> files, CancellationToken cancellationToken = default);
}
