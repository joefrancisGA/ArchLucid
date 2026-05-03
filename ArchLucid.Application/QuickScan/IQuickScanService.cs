using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.QuickScan;

/// <summary>
///     Service for executing lightweight, single-pass architecture scans bypassing the full knowledge graph.
/// </summary>
public interface IQuickScanService
{
    /// <summary>
    ///     Executes a quick scan on the provided files.
    /// </summary>
    Task<QuickScanResult> ScanAsync(IReadOnlyDictionary<string, string> files, CancellationToken cancellationToken = default);
}
