using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>Resolves cached Quick Scan operational posture (TB-898).</summary>
public interface IQuickScanSafetyOperationalStateProvider
{
    Task<QuickScanSafetyOperationalSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);

    void InvalidateCache();
}
