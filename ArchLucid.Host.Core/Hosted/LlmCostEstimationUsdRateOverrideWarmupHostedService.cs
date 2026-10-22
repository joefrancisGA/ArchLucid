using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Loads persisted LLM USD/M rate overrides into <see cref="LlmCostEstimationUsdRateOverrideCache" />
///     on a background thread so host startup is not blocked.
/// </summary>
public sealed class LlmCostEstimationUsdRateOverrideWarmupHostedService(
    IServiceScopeFactory scopeFactory,
    LlmCostEstimationUsdRateOverrideCache cache,
    ILogger<LlmCostEstimationUsdRateOverrideWarmupHostedService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly LlmCostEstimationUsdRateOverrideCache _cache =
        cache ?? throw new ArgumentNullException(nameof(cache));

    private readonly ILogger<LlmCostEstimationUsdRateOverrideWarmupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            ILlmCostEstimationUsdRateOverrideRepository repository =
                scope.ServiceProvider.GetRequiredService<ILlmCostEstimationUsdRateOverrideRepository>();

            LlmCostEstimationUsdRateOverrideRow? row = await repository.TryGetAsync(stoppingToken).ConfigureAwait(false);

            _cache.Set(row);


            if (row is not null && _logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Loaded persisted LLM USD/M rate override (updated {UpdatedUtc} by {UpdatedBy}).",
                    row.UpdatedUtc,
                    row.UpdatedBy);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Startup should not fail the host if the table is missing on an older DB — operators run migrations first.

            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to load persisted LLM USD/M rate override; using appsettings-only rates until fixed.");
        }
    }
}
