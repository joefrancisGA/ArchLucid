using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     Startup demo-seed orchestration shared by <see cref="DemoSeedStartupHostedService" /> and unit tests.
/// </summary>
internal static class DemoSeedStartupWork
{
    internal static async Task RunAsync(
        IServiceScopeFactory scopeFactory,
        DemoOptions demoOptions,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(demoOptions);
        ArgumentNullException.ThrowIfNull(logger);

        if (!demoOptions.AnonymousViewer.Enabled)
        {
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Demo seed skipped (AnonymousViewer disabled).");

            return;
        }

        if (!demoOptions.Enabled)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    "Demo seed skipped: Demo:AnonymousViewer:Enabled is true but Demo:Enabled is false.");
            }

            return;
        }

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            IDemoSeedService demoSeed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();

            await demoSeed.SeedAsync(cancellationToken).ConfigureAwait(false);

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Demo seed applied on startup.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(ex, "Demo seed failed on startup; continuing without demo data.");
        }
    }
}
