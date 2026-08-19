using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>Process-wide operational override store for simulator/tests (TB-898).</summary>
public sealed class InMemoryQuickScanSafetyOperationalStateStore : IQuickScanSafetyOperationalStateStore
{
    private readonly object _sync = new();

    private QuickScanSafetyOperationalOverrideRow? _override;

    /// <inheritdoc />
    public Task<QuickScanSafetyOperationalOverrideRow?> GetOverrideAsync(CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            return Task.FromResult(_override);
        }
    }

    /// <inheritdoc />
    public Task SetOverrideAsync(
        QuickScanSafetyOperationalOverrideWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        lock (_sync)
        {
            _override = new QuickScanSafetyOperationalOverrideRow
            {
                Mode = request.Mode,
                PublicMessage = request.PublicMessage,
                Reason = request.Reason,
                ActorUserId = request.ActorUserId,
                UpdatedUtc = request.UpdatedUtc,
            };
        }

        return Task.CompletedTask;
    }
}
