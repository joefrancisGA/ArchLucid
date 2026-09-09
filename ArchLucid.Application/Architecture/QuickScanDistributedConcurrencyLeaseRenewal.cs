using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Background lease renewal for distributed Quick Scan concurrency slots.</summary>
internal static class QuickScanDistributedConcurrencyLeaseRenewal
{
    public static async Task RunLoopAsync(
        Guid leaseId,
        IQuickScanDistributedConcurrencyStore store,
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
        TimeProvider timeProvider,
        CancellationTokenSource executeCancellationSource)
    {
        QuickScanSafetyConcurrencyLimits limits = safetyOptions.CurrentValue.Concurrency;
        TimeSpan renewalInterval = TimeSpan.FromSeconds(limits.LeaseRenewalIntervalSeconds);
        TimeSpan leaseDuration = TimeSpan.FromSeconds(limits.LeaseDurationSeconds);
        CancellationToken cancellationToken = executeCancellationSource.Token;

        using PeriodicTimer timer = new(renewalInterval);

        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken).ConfigureAwait(false))
            {

                try
                {
                    await store.RenewLeaseAsync(
                        leaseId,
                        timeProvider.GetUtcNow(),
                        leaseDuration,
                        cancellationToken).ConfigureAwait(false);
                }
                catch (Exception) when (cancellationToken.IsCancellationRequested is false)
                {
                    executeCancellationSource.Cancel();

                    break;
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
}
