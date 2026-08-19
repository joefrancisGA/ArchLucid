using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     Startup demo-seed orchestration shared by <see cref="DemoSeedStartupHostedService" /> and unit tests.
/// </summary>
internal static class DemoSeedStartupWork
{
    internal static async Task RunAsync(
        IServiceScopeFactory scopeFactory,
        IHostEnvironment hostEnvironment,
        DemoOptions demoOptions,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(hostEnvironment);
        ArgumentNullException.ThrowIfNull(demoOptions);
        ArgumentNullException.ThrowIfNull(logger);

        if (!DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(hostEnvironment, demoOptions))
        {
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Demo seed skipped (showcase bootstrap policy).");

            return;
        }

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            IDemoSeedService demoSeed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();

            await demoSeed.SeedAsync(cancellationToken).ConfigureAwait(false);

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Showcase demo seed applied on startup.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(ex, "Showcase demo seed failed on startup; continuing without demo data.");
        }
    }
}
