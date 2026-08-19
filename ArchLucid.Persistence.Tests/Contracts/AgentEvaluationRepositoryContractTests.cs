using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

public abstract class AgentEvaluationRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IAgentEvaluationRepository CreateRepository();

    protected virtual Task PrepareRunAndTaskAsync(string requestId, string runId, string taskId, CancellationToken ct)
    {
        _ = requestId;
        _ = runId;
        _ = taskId;
        _ = ct;

        return Task.CompletedTask;
    }

    [SkippableFact]
    public async Task CreateMany_replaces_prior_batch_for_same_run()
    {
        SkipIfSqlServerUnavailable();
        IAgentEvaluationRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-ae-" + Guid.NewGuid().ToString("N");
        string taskId = "task-ae-" + Guid.NewGuid().ToString("N");
        await PrepareRunAndTaskAsync(requestId, runId, taskId, CancellationToken.None);

        List<AgentEvaluationRecord> first =
        [
            NewEvaluation(runId, taskId, "e1", EvaluationTypeConstants.Support),
            NewEvaluation(runId, taskId, "e2", EvaluationTypeConstants.Caution)
        ];

        await repo.CreateManyAsync(first, CancellationToken.None);

        List<AgentEvaluationRecord> second = [NewEvaluation(runId, taskId, "e3", EvaluationTypeConstants.Oppose)];

        await repo.CreateManyAsync(second, CancellationToken.None);

        IReadOnlyList<AgentEvaluationRecord> loaded = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        loaded.Should().HaveCount(1);
        loaded[0].EvaluationId.Should().Be("e3");
        loaded[0].EvaluationType.Should().Be(EvaluationTypeConstants.Oppose);
    }

    [SkippableFact]
    public async Task CreateMany_then_GetByRunId_orders_by_CreatedUtc()
    {
        SkipIfSqlServerUnavailable();
        IAgentEvaluationRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-ae2-" + Guid.NewGuid().ToString("N");
        string taskId = "task-ae2-" + Guid.NewGuid().ToString("N");
        await PrepareRunAndTaskAsync(requestId, runId, taskId, CancellationToken.None);
        DateTime older = new(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);

        List<AgentEvaluationRecord> batch =
        [
            NewEvaluation(runId, taskId, "late", EvaluationTypeConstants.Support, newer),
            NewEvaluation(runId, taskId, "early", EvaluationTypeConstants.Support, older)
        ];

        await repo.CreateManyAsync(batch, CancellationToken.None);

        IReadOnlyList<AgentEvaluationRecord> loaded = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        loaded.Should().HaveCount(2);
        loaded[0].EvaluationId.Should().Be("early");
        loaded[1].EvaluationId.Should().Be("late");
    }

    private static AgentEvaluationRecord NewEvaluation(
        string runId,
        string taskId,
        string evaluationId,
        string evaluationType,
        DateTime? createdUtc = null)
    {
        return new AgentEvaluationRecord
        {
            EvaluationId = evaluationId,
            RunId = runId,
            TargetAgentTaskId = taskId,
            EvaluationType = evaluationType,
            ConfidenceDelta = 0.1,
            Rationale = "r",
            CreatedUtc = createdUtc ?? TimeProvider.System.UtcNowDateTime()
        };
    }
}
