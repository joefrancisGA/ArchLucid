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
        CancellationToken cancellationToken = executeCancellationSource.Token;

        try
        {
            while (cancellationToken.IsCancellationRequested is false)
            {
                QuickScanSafetyConcurrencyLimits limits = safetyOptions.CurrentValue.Concurrency;
                int leaseDurationSeconds = limits.LeaseDurationSeconds;
                int renewalIntervalSeconds = Math.Min(
                    limits.LeaseRenewalIntervalSeconds,
                    Math.Max(1, leaseDurationSeconds - 1));
                TimeSpan leaseDuration = TimeSpan.FromSeconds(leaseDurationSeconds);
                TimeSpan renewalInterval = TimeSpan.FromSeconds(renewalIntervalSeconds);

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

                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                try
                {
                    await Task.Delay(renewalInterval, timeProvider, cancellationToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
}
