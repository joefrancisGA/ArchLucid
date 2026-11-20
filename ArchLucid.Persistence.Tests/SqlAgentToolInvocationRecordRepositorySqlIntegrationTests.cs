using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlAgentToolInvocationRecordRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ReplaceForTraceAsync_preserves_previous_invocation_when_insert_fails()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlAgentToolInvocationRecordRepository repository = new(new SqlConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        string traceId = Guid.NewGuid().ToString("N");

        AgentToolInvocationRecord NewRecord(string argsPreview) => new()
        {
            TenantId = tenantId,
            RunId = runId,
            TraceId = traceId,
            TaskId = "task",
            SortOrder = 1,
            ToolName = "lookup",
            ArgsPreview = argsPreview,
            Outcome = "completed",
            InvokedAtUtc = DateTime.UtcNow,
        };

        await repository.ReplaceForTraceAsync(NewRecord("previous"));
        await Assert.ThrowsAsync<SqlException>(() => repository.ReplaceForTraceAsync(NewRecord(null!)));

        AgentToolInvocationRecord preserved = Assert.Single(await repository.ListByRunAsync(tenantId, runId));
        Assert.Equal("previous", preserved.ArgsPreview);

        await repository.ReplaceForTraceAsync(NewRecord("replacement"));

        AgentToolInvocationRecord replaced = Assert.Single(await repository.ListByRunAsync(tenantId, runId));
        Assert.Equal("replacement", replaced.ArgsPreview);
    }
}
