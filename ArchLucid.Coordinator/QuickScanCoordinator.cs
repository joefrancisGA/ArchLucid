using ArchLucid.Application.QuickScan;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Coordinator;

/// <summary>
///     Coordinates lightweight architecture scans bypassing the full knowledge graph.
/// </summary>
public sealed class QuickScanCoordinator(IQuickScanService quickScanService)
{
    /// <summary>
    ///     Executes a quick scan on the provided files.
    /// </summary>
    public Task<QuickScanResult> ScanAsync(IReadOnlyDictionary<string, string> files, CancellationToken cancellationToken = default)
    {
        if (quickScanService is null) throw new ArgumentNullException(nameof(quickScanService));
        if (files is null) throw new ArgumentNullException(nameof(files));

        return quickScanService.ScanAsync(files, cancellationToken);
    }
}
