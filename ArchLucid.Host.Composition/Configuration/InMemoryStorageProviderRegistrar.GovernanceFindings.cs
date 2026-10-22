namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterGovernanceFindings(IServiceCollection services)
    {
        RegisterGovernanceFindingsFindingsInspect(services);
        RegisterGovernanceFindingsAdvisoryLearning(services);
        RegisterGovernanceFindingsPolicyAlertsGovernance(services);
    }
}
