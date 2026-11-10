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

    /// <summary>Primer + two SQL clients with explicit tenant/workspace/project scope headers.</summary>
    public static async Task WithTwoScopedClientsAsync(
        GreenfieldSqlApiFactory factory,
        Guid tenantA,
        Guid workspaceA,
        Guid projectA,
        Guid tenantB,
        Guid workspaceB,
        Guid projectB,
        Func<HttpClient, HttpClient, Task> exercise)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentNullException.ThrowIfNull(exercise);

        await WithGreenfieldPrimerAsync(
            factory,
            async () =>
            {
                HttpClient clientA = factory.CreateClient();
                HttpClient clientB = factory.CreateClient();

                try
                {
                    GreenfieldIntegrationTenantScope.WireScope(clientA, tenantA, workspaceA, projectA);
                    GreenfieldIntegrationTenantScope.WireScope(clientB, tenantB, workspaceB, projectB);

                    await exercise(clientA, clientB).ConfigureAwait(false);
                }
                finally
                {
                    clientA.Dispose();
                    clientB.Dispose();
                }
            }).ConfigureAwait(false);
    }
}
