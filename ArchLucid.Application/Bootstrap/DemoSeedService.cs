using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Idempotent seed for the Retail Checkout Modernization **trusted baseline** (two committed runs, governance workflow,
///     activations).
/// </summary>
/// <remarks>
///     Persists via <c>ArchLucid.Persistence</c> repositories. Scenario bodies live in
///     <see cref="Seeders.IDemoSeedScenarioSeeder"/> implementations; this type sequences registry steps only.
///     See <c>docs/TRUSTED_BASELINE.md</c>.
/// </remarks>
public sealed class DemoSeedService(
    IScopeContextProvider scopeContextProvider,
    IEnumerable<Seeders.IDemoSeedScenarioSeeder> scenarioSeeders,
    Seeders.DemoSeedTrialWelcomeSeeder trialWelcomeSeeder,
    ILogger<DemoSeedService> logger) : IDemoSeedService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IReadOnlyDictionary<string, Seeders.IDemoSeedScenarioSeeder> _seedersByStep =
        BuildSeederLookup(scenarioSeeders);

    private readonly Seeders.DemoSeedTrialWelcomeSeeder _trialWelcomeSeeder =
        trialWelcomeSeeder ?? throw new ArgumentNullException(nameof(trialWelcomeSeeder));

    private readonly ILogger<DemoSeedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Startup hosted seed and <c>POST /v1/demo/seed</c> can overlap in CI — serialize to avoid partial workspace fixtures.</summary>
    private static readonly SemaphoreSlim DemoSeedConcurrencyGate = new(1, 1);

    /// <inheritdoc/>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await DemoSeedConcurrencyGate.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            await SeedAsyncCore(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            DemoSeedConcurrencyGate.Release();
        }
    }

    /// <inheritdoc/>
    public Task SeedTrialWelcomeRunAsync(CancellationToken cancellationToken = default) =>
        _trialWelcomeSeeder.SeedAsync(cancellationToken);

    private async Task SeedAsyncCore(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scope.TenantId);

        foreach (DemoSeedScenarioDefinition registration in DemoSeedScenarioRegistry.ListSeedSteps())
        {
            await RunSeedStepAsync(registration.StepName, cancellationToken).ConfigureAwait(false);
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Demo seed completed (Retail Checkout Modernization). Runs: {Baseline}, {Hardened}.",
                demo.RunBaseline,
                demo.RunHardened);
        }
    }

    private async Task RunSeedStepAsync(string stepName, CancellationToken cancellationToken)
    {
        if (!_seedersByStep.TryGetValue(stepName, out Seeders.IDemoSeedScenarioSeeder? seeder))
        {
            throw new InvalidOperationException(
                $"Demo seed registry step '{stepName}' has no registered {nameof(Seeders.IDemoSeedScenarioSeeder)}.");
        }

        try
        {
            await seeder.SeedStepAsync(stepName, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Demo seed step {Step} failed.", stepName);

            throw;
        }
    }

    private static IReadOnlyDictionary<string, Seeders.IDemoSeedScenarioSeeder> BuildSeederLookup(
        IEnumerable<Seeders.IDemoSeedScenarioSeeder> scenarioSeeders)
    {
        Dictionary<string, Seeders.IDemoSeedScenarioSeeder> lookup = new(StringComparer.Ordinal);

        foreach (Seeders.IDemoSeedScenarioSeeder seeder in scenarioSeeders)
        {
            foreach (string stepName in seeder.StepNames)
            {
                if (!lookup.TryAdd(stepName, seeder))
                {
                    throw new InvalidOperationException(
                        $"Duplicate demo seed step registration for '{stepName}'.");
                }
            }
        }

        return lookup;
    }
}
