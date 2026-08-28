namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    private static void RegisterSqlOperationalSingletons(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        SqlOperationalSingletonsRegistrar.Register(services, configuration, connectionString);
        RegisterDtfOrchestrationInfrastructure(services, configuration, connectionString);
    }

    /// <summary>
    ///     Registers Durable Task Framework worker and client when Durable Task orchestration is enabled.
    /// </summary>
    private static void RegisterDtfOrchestrationInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        SqlDtfOrchestrationInfrastructureRegistrar.Register(services, configuration, connectionString);
    }
}
