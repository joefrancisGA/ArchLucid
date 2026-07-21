using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IQuickScanSafetyOperationalStateProvider" />
public sealed class QuickScanSafetyOperationalStateProvider(
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IQuickScanSafetyOperationalStateStore store,
    IMemoryCache memoryCache,
    IHostEnvironment hostEnvironment,
    ILogger<QuickScanSafetyOperationalStateProvider> logger) : IQuickScanSafetyOperationalStateProvider
{
    private const string CacheKey = "quick-scan-safety-operational-snapshot";

    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(5);

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IQuickScanSafetyOperationalStateStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly ILogger<QuickScanSafetyOperationalStateProvider> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<QuickScanSafetyOperationalSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(CacheKey, out QuickScanSafetyOperationalSnapshot? cached) && cached is not null)
        {
            return cached;
        }

        QuickScanSafetyOperationalSnapshot snapshot = await LoadSnapshotAsync(cancellationToken).ConfigureAwait(false);

        _memoryCache.Set(CacheKey, snapshot, CacheDuration);

        return snapshot;
    }

    /// <inheritdoc />
    public void InvalidateCache() => _memoryCache.Remove(CacheKey);

    private async Task<QuickScanSafetyOperationalSnapshot> LoadSnapshotAsync(CancellationToken cancellationToken)
    {
        QuickScanSafetyOptions options = _safetyOptions.CurrentValue;

        try
        {
            QuickScanSafetyOperationalOverrideRow? runtimeOverride =
                await _store.GetOverrideAsync(cancellationToken).ConfigureAwait(false);

            return BuildSnapshot(options, runtimeOverride, storeHealthy: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quick Scan operational override store is unavailable.");

            if (IsProductionLike())
            {
                return QuickScanSafetyOperationalSnapshot.FailClosed(options.EmergencyDisabledMessage);
            }

            return BuildSnapshot(options, runtimeOverride: null, storeHealthy: false);
        }
    }

    private QuickScanSafetyOperationalSnapshot BuildSnapshot(
        QuickScanSafetyOptions options,
        QuickScanSafetyOperationalOverrideRow? runtimeOverride,
        bool storeHealthy)
    {
        QuickScanSafetyOperationalMode mode = runtimeOverride?.Mode ?? QuickScanSafetyOperationalMode.Normal;
        string publicMessage = runtimeOverride?.PublicMessage ?? options.EmergencyDisabledMessage;

        if (mode == QuickScanSafetyOperationalMode.Normal)
        {
            QuickScanSafetyEffectiveFeatureState effective = options.ResolveEffectiveFeatureState();

            return new QuickScanSafetyOperationalSnapshot
            {
                Mode = options.EmergencyDisabled
                    ? QuickScanSafetyOperationalMode.EmergencyDisabled
                    : QuickScanSafetyOperationalMode.Normal,
                AnonymousExecutionAllowed = effective.Enabled && effective.AnonymousExecutionEnabled,
                SampleResultAvailable = effective.SampleFallbackEnabled,
                PublicMessage = options.EmergencyDisabled ? publicMessage : string.Empty,
                StoreHealthy = storeHealthy,
            };
        }

        if (mode == QuickScanSafetyOperationalMode.Disabled)
        {
            return new QuickScanSafetyOperationalSnapshot
            {
                Mode = mode,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = false,
                PublicMessage = publicMessage,
                StoreHealthy = storeHealthy,
            };
        }

        if (mode == QuickScanSafetyOperationalMode.SampleOnly)
        {
            return new QuickScanSafetyOperationalSnapshot
            {
                Mode = mode,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = publicMessage,
                StoreHealthy = storeHealthy,
            };
        }

        return new QuickScanSafetyOperationalSnapshot
        {
            Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
            AnonymousExecutionAllowed = false,
            SampleResultAvailable = options.SampleFallbackEnabled,
            PublicMessage = publicMessage,
            StoreHealthy = storeHealthy,
        };
    }

    private bool IsProductionLike() =>
        string.Equals(_hostEnvironment.EnvironmentName, Environments.Production, StringComparison.OrdinalIgnoreCase)
        || string.Equals(_hostEnvironment.EnvironmentName, "Staging", StringComparison.OrdinalIgnoreCase);
}
