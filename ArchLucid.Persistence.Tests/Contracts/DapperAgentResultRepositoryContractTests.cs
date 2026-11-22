using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperAgentResultRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : AgentResultRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IAgentResultRepository CreateRepository()
    {
        TestSqlDbConnectionFactory connectionFactory = new(fixture.ConnectionString);
        AgentResultEnrichmentRepository enrichmentRepository = new(connectionFactory);

        return new AgentResultRepository(connectionFactory, enrichmentRepository);
    }

    protected override async Task PrepareRunTaskChainAsync(string requestId, string runId, AgentTask task,
        CancellationToken ct)
    {
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(ct);
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId, ct);
        await ArchitectureCommitTestSeed.InsertAgentTaskAsync(connection, task, ct);
    }

    [SkippableFact]
    public async Task ReplaceForRunTask_rolls_back_the_delete_when_the_insert_fails()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repository = CreateRepository();
        string requestId = "arr-replace-rollback-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask replacedTask = NewTaskRow(runId, "replace-rollback-target");
        AgentTask conflictingTask = NewTaskRow(runId, "replace-rollback-conflict");

        await PrepareRunTaskChainAsync(requestId, runId, replacedTask, CancellationToken.None);
        await PrepareRunTaskChainAsync(requestId, runId, conflictingTask, CancellationToken.None);

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        await repository.CreateAsync(
            NewResult(runId, replacedTask.TaskId, "original-result", createdUtc),
            CancellationToken.None);
        await repository.CreateAsync(
            NewResult(runId, conflictingTask.TaskId, "conflicting-result-id", createdUtc),
            CancellationToken.None);

        Func<Task> replace = () => repository.ReplaceForRunTaskAsync(
            NewResult(runId, replacedTask.TaskId, "conflicting-result-id", createdUtc.AddSeconds(1)),
            CancellationToken.None);

        await replace.Should().ThrowAsync<SqlException>();

        IReadOnlyList<AgentResult> loaded = await repository.GetByRunIdAsync(
            ArchitectureCommitTestSeed.AsScopeContext(),
            runId,
            CancellationToken.None);

        loaded.Select(static result => result.ResultId)
            .Should()
            .BeEquivalentTo(["original-result", "conflicting-result-id"]);
    }
}
