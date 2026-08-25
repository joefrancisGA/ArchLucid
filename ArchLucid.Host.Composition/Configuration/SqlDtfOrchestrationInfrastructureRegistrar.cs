using Microsoft.DurableTask;
using Microsoft.DurableTask.Client;
using Microsoft.DurableTask.Worker;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Registers Durable Task Framework worker and client when Durable Task orchestration is enabled.
/// </summary>
internal static class SqlDtfOrchestrationInfrastructureRegistrar
{
    /// <param name="connectionString">
    ///     ArchLucid tenant-plane SQL connection string. Orchestration history is not written here by the
    ///     <c>Microsoft.DurableTask.Worker</c> process itself (it uses gRPC); when the out-of-process durable engine is
    ///     configured with the MSSQL provider against this same catalog, the provider creates and owns
    ///     <c>dt.</c>-prefixed objects — include them in DBA backup/restore/retention runbooks alongside ArchLucid tables.
    /// </param>
    /// <remarks>
    ///     <para>
    ///         The GA task note referenced <c>builder.UseSqlServer(connectionString)</c>; that API is not exposed on
    ///         <see cref="T:Microsoft.DurableTask.Worker.IDurableTaskWorkerBuilder" /> for <c>Microsoft.DurableTask.Worker</c> 1.x
    ///         (SQL persistence is the legacy <c>DurableTask.SqlServer</c> / WebJobs stack or lives behind a gRPC sidecar).
    ///     </para>
    ///     <para>
    ///         Configure the worker/client transport with <c>ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint</c>
    ///         (Durable Task Scheduler, emulator, or another engine exposing the Durable Task gRPC contract).
    ///     </para>
    /// </remarks>
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        if (!IsDtfEnabled(configuration))
            return;

        ArgumentNullException.ThrowIfNull(connectionString);

        string? grpcEndpoint = configuration["ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint"];

        if (string.IsNullOrWhiteSpace(grpcEndpoint))
            throw new InvalidOperationException(
                "ArchLucid:AuthorityPipeline:OrchestratorBackend is DurableTask but ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint is empty. "
                + "Set a gRPC address for the Durable Task worker (scheduler / sidecar).");

        services.AddDurableTaskWorker(builder =>
        {
            builder.AddTasks(registry => registry.AddAllGeneratedTasks());
            builder.UseGrpc(grpcEndpoint.Trim());
        });

        services.AddDurableTaskClient(builder =>
        {
            builder.UseGrpc(grpcEndpoint.Trim());
        });
    }

    private static bool IsDtfEnabled(IConfiguration configuration)
    {
        string? raw = configuration["ArchLucid:AuthorityPipeline:OrchestratorBackend"];

        return !string.IsNullOrWhiteSpace(raw)
               && string.Equals(raw.Trim(), "DurableTask", StringComparison.OrdinalIgnoreCase);
    }
}
