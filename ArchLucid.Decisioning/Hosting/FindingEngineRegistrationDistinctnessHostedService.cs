using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Plugins;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Hosting;

/// <summary>
///     Wave-3 suggestion 22 / wave-5 suggestion 50: fail host start when product engine types collide;
///     populate plugin skip set from DI registration.
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

        HashSet<string> registeredEngineTypeIds = graphPure
            .Select(static engine => engine.EngineType)
            .Concat(effectful.Select(static engine => engine.EngineType))
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        RegisteredFindingEngineTypeRegistry.ReplaceRegisteredEngineTypeIds(registeredEngineTypeIds);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Finding engine registration distinctness validated ({Count} engine types).",
                registeredEngineTypeIds.Count);
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
