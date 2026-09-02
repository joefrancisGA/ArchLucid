using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Hosting;

/// <summary>
///     Wave-3 suggestion 22: fail host start when product engine types collide or drift from the catalog.
/// </summary>
public sealed class FindingEngineRegistrationDistinctnessHostedService(
    IServiceProvider serviceProvider,
    ILogger<FindingEngineRegistrationDistinctnessHostedService> logger) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = serviceProvider.CreateScope();
        IEnumerable<IFindingEngine> graphPure = scope.ServiceProvider.GetServices<IFindingEngine>();
        IEnumerable<IEffectfulFindingEngine> effectful =
            scope.ServiceProvider.GetServices<IEffectfulFindingEngine>();

        FindingEngineRegistrationDistinctnessValidator.ValidateOrThrow(graphPure, effectful);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Finding engine registration distinctness validated ({Count} engine types).", graphPure.Count() + effectful.Count());

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
