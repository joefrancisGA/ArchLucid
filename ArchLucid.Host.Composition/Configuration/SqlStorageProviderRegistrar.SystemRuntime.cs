namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    /// <summary>Control-plane SQL: system catalog factory, bindings, resolver, provisioning orchestration.</summary>
    private static void RegisterSystemRuntimeInfrastructure(
        IServiceCollection services,
        string connectionString,
        string effectiveSystemConnectionString,
        bool enforceServerCertificateTrust)
    {
        SqlSystemRuntimeInfrastructureRegistrar.Register(
            services,
            connectionString,
            effectiveSystemConnectionString,
            enforceServerCertificateTrust);
    }
}
