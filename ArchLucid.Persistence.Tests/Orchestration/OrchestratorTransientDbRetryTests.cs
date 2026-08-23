using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class OrchestratorTransientDbRetryTests
{
    [SkippableFact]
    public async Task ExecuteAsync_retries_transient_sql_deadlock_on_save()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(1205);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_non_transient_sql_errors()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw SqlExceptionTestFactory.Create(547);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_fk_violation_wrapped_in_timeout_exception()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new TimeoutException("command timed out", fkViolation);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<TimeoutException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_aggregate_exception_lists_it_after_non_transient_sql()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(fkViolation, deadlock);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }
}
