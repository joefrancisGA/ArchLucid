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

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_second_attempt_raises_permanent_only_after_mixed_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(fkViolation, deadlock);

                throw fkViolation;
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_operation_canceled()
    {
        int attempts = 0;
        using CancellationTokenSource cancellation = new();

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            ct =>
            {
                attempts++;
                cancellation.Cancel();
                throw new OperationCanceledException(ct);
            },
            cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_aggregate_is_nested_in_wrapper_exception()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException(
                    "parallel persist failed",
                    new AggregateException(fkViolation, deadlock));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_retries_transient_sql_deadlock()
    {
        int attempts = 0;

        int result = await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(1205);

                return Task.FromResult(42);
            },
            CancellationToken.None);

        attempts.Should().Be(2);
        result.Should().Be(42);
    }

    [SkippableFact]
    public async Task ExecuteAsync_exhausts_max_retries_then_throws_transient_sql_error()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw SqlExceptionTestFactory.Create(1205);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(4);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_empty_aggregate_exception()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException();
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_aggregate_with_only_non_transient_sql_inners()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException uniqueViolation = SqlExceptionTestFactory.Create(2627);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(fkViolation, uniqueViolation);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_does_not_retry_non_transient_sql_errors()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                return Task.FromException<int>(SqlExceptionTestFactory.Create(547));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_bare_timeout_exception()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new TimeoutException("command timed out");

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_sql_timeout_error_number_minus_two()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(-2);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_sql_unavailable_error_40613()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(40613);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_nested_aggregate_exception_when_inner_aggregate_contains_deadlock()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(new AggregateException(deadlock));

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_bare_invalid_operation_exception()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException("orchestrator persist failed");
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_exhausts_max_retries_then_throws_transient_sql_error()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                return Task.FromException<int>(SqlExceptionTestFactory.Create(1205));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(4);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_wrapped_in_invalid_operation_exception()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new InvalidOperationException("repository persist failed", deadlock);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_aggregate_inner_is_wrapped_exception()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(new InvalidOperationException("parallel persist failed", deadlock));

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_elastic_pool_capacity_error_40501()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(40501);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_aggregate_with_bare_timeout_exception_inner()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(new TimeoutException("command timed out"));

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_task_canceled()
    {
        int attempts = 0;
        using CancellationTokenSource cancellation = new();

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                cancellation.Cancel();
                throw new TaskCanceledException("task canceled", null, cancellation.Token);
            },
            cancellation.Token);

        await act.Should().ThrowAsync<TaskCanceledException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_sql_unavailable_error_40645()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(40645);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_service_capacity_error_40197()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(40197);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_network_connection_error_233()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(233);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_throttling_error_49918()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(49918);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_resource_throttling_error_10928()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(10928);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_network_connection_error_10053()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(10053);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_network_connection_error_10054()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(10054);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_network_connection_error_10060()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(10060);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_resource_throttling_error_10929()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(10929);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_retries_azure_throttling_error_49919()
    {
        int attempts = 0;

        int result = await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(49919);

                return Task.FromResult(7);
            },
            CancellationToken.None);

        attempts.Should().Be(2);
        result.Should().Be(7);
    }
}
