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
        int leaseDurationSeconds = limits.LeaseDurationSeconds;
        int renewalIntervalSeconds = Math.Min(
            limits.LeaseRenewalIntervalSeconds,
            Math.Max(1, leaseDurationSeconds - 1));
        TimeSpan renewalInterval = TimeSpan.FromSeconds(renewalIntervalSeconds);
        TimeSpan leaseDuration = TimeSpan.FromSeconds(leaseDurationSeconds);
        CancellationToken cancellationToken = executeCancellationSource.Token;

        using PeriodicTimer timer = new(renewalInterval);

        try
        {
            do
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
            while (await timer.WaitForNextTickAsync(cancellationToken).ConfigureAwait(false));
        }
        catch (OperationCanceledException)
        {
        }
    }
}
