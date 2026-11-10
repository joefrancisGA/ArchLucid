namespace ArchLucid.Api.Tests.Security;

/// <summary>Shared greenfield primer warmup before tenant-isolation exercises.</summary>
public static class TenantIsolationScenario
{
    public static async Task WithGreenfieldPrimerAsync(GreenfieldSqlApiFactory factory, Func<Task> exercise)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentNullException.ThrowIfNull(exercise);

        using HttpClient primer = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);

        await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer)
            .ConfigureAwait(false);

        await exercise().ConfigureAwait(false);
    }
}
