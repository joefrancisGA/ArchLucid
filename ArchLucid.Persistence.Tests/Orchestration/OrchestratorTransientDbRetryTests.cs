using System.Reflection;

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
    public async Task ExecuteAsync_retries_sql_snapshot_update_conflict_error_3960()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(3960);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_sql_snapshot_update_conflict_error_41301()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(41301);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_sql_snapshot_update_conflict_error_41302()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(41302);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_wrapped_in_ioexception_without_aggregate()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new IOException("network read failed", deadlock);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_sql_lock_resource_error_1204()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(1204);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_sql_lock_timeout_error_1222()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(1222);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

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
    public async Task ExecuteAsync_does_not_retry_mixed_transient_and_permanent_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(fkViolation, deadlock);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
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

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
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
    public async Task ExecuteAsync_does_not_retry_mixed_transient_and_permanent_aggregate_nested_in_wrapper_when_deadlock_is_listed_first()
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
                    new AggregateException(deadlock, fkViolation));
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
    public async Task ExecuteAsync_retries_deadlock_when_aggregate_inner_wraps_nested_aggregate()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                {
                    throw new AggregateException(
                        new InvalidOperationException(
                            "parallel persist failed",
                            new AggregateException(deadlock)));
                }

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
    public async Task ExecuteAsync_retries_azure_throttling_error_49920()
    {
        int attempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw SqlExceptionTestFactory.Create(49920);

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
    public async Task ExecuteAsync_retries_transient_sql_when_inner_chain_has_empty_aggregate_shell()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        SetInnerException(deadlock, new AggregateException());

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw deadlock;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_wrapper_inner_aggregate_is_empty_shell()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException(
                    "parallel persist failed",
                    new AggregateException());
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
        SqlTransientDetector.IsTransient(
                new InvalidOperationException("parallel persist failed", new AggregateException()))
            .Should()
            .BeFalse("empty nested aggregate shells carry no transient SQL on the wrapper chain");
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_when_top_level_inner_is_wrapper_around_another_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(
                    new InvalidOperationException(
                        "outer parallel persist failed",
                        new AggregateException(
                            new InvalidOperationException(
                                "inner parallel persist failed",
                                new AggregateException(deadlock, fkViolation)))));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_double_repository_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException(
                    "outer parallel persist failed",
                    new AggregateException(
                        new InvalidOperationException(
                            "inner parallel persist failed",
                            new AggregateException(deadlock, fkViolation))));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_ioexception_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new IOException(
                    "parallel persist failed",
                    new AggregateException(deadlock, fkViolation));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<IOException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_nested_inside_wrapper_when_top_level_is_also_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(
                    new InvalidOperationException(
                        "parallel persist failed",
                        new AggregateException(deadlock, fkViolation)));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
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

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_aggregate_with_deadlock_and_task_canceled_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(deadlock, new TaskCanceledException("parallel task canceled"));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_aggregate_with_deadlock_and_operation_canceled_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(deadlock, new OperationCanceledException("parallel task canceled"));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_nested_mixed_aggregate_follows_transient_sql_on_wrapper_chain()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        SqlException transientSql = SqlExceptionTestFactory.Create(1205);
        SetInnerException(
            transientSql,
            new AggregateException(deadlock, fkViolation));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException("parallel persist failed", transientSql);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_transient_sql_wraps_mixed_parallel_persist_aggregate_on_inner_chain()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        SqlException transientSql = SqlExceptionTestFactory.Create(1205);
        SetInnerException(
            transientSql,
            new AggregateException(deadlock, fkViolation));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw transientSql;
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_honors_cancellation_during_retry_backoff_after_transient_sql()
    {
        int attempts = 0;
        using CancellationTokenSource cancellation = new();

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                {
                    Task.Run(
                        () =>
                        {
                            Thread.Sleep(100);
                            cancellation.Cancel();
                        });

                    throw SqlExceptionTestFactory.Create(1205);
                }

                return Task.CompletedTask;
            },
            cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_first_nested_aggregate_on_chain_is_empty_shell_before_mixed_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException mixed = new(deadlock, fkViolation);
        AggregateException emptyShell = new();
        SetInnerException(emptyShell, mixed);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException("parallel persist failed", emptyShell);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public void Orchestrator_retry_delay_exponential_base_matches_polly_attempt_number_plus_one()
    {
        TimeSpan baseDelay = TimeSpan.FromSeconds(2);

        for (int pollyAttemptNumber = 0; pollyAttemptNumber <= 2; pollyAttemptNumber++)
        {
            int retryAttempt = pollyAttemptNumber + 1;
            double expectedBaseMilliseconds = baseDelay.TotalMilliseconds * Math.Pow(2, retryAttempt - 1);

            TimeSpan delay = SqlOpenRetryDelayCalculator.Calculate(retryAttempt, baseDelay, 0);

            delay.Should().Be(TimeSpan.FromMilliseconds(expectedBaseMilliseconds));
        }
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_when_first_populated_aggregate_on_inner_chain_hides_later_mixed_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException mixed = new(deadlock, fkViolation);
        AggregateException transientOnly = new(deadlock);
        SetInnerException(transientOnly, mixed);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException("parallel persist failed", transientOnly);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(4, "TryGetParallelPersistInners stops at the first populated aggregate on the inner chain");
    }

    [SkippableFact]
    public void Orchestrator_retry_jitter_span_is_positive_for_each_polly_retry_attempt()
    {
        TimeSpan baseDelay = TimeSpan.FromSeconds(2);

        for (int pollyAttemptNumber = 0; pollyAttemptNumber <= 2; pollyAttemptNumber++)
        {
            int retryAttempt = pollyAttemptNumber + 1;
            double baseMilliseconds = baseDelay.TotalMilliseconds * Math.Pow(2, retryAttempt - 1);

            SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(baseMilliseconds)
                .Should()
                .BeGreaterThan(0);
        }
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_wrapped_in_target_invocation_exception()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        TargetInvocationException wrapper = new("invoke failed", deadlock);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw wrapper;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_aggregate_inner_is_target_invocation_exception()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        TargetInvocationException wrapper = new("invoke failed", deadlock);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(wrapper);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_cancellation_is_requested_during_delegate_execution()
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
    public async Task ExecuteAsync_isolates_retry_attempt_counters_across_concurrent_callers()
    {
        int firstAttempts = 0;
        int secondAttempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Task first = OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                Interlocked.Increment(ref firstAttempts);

                if (firstAttempts == 1)
                    throw deadlock;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        Task second = OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                Interlocked.Increment(ref secondAttempts);

                if (secondAttempts == 1)
                    throw deadlock;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        await Task.WhenAll(first, second);

        firstAttempts.Should().Be(2);
        secondAttempts.Should().Be(2);
    }

    [SkippableFact]
    public void Third_orchestrator_retry_delay_with_max_negative_jitter_stays_positive()
    {
        TimeSpan baseDelay = TimeSpan.FromSeconds(2);
        const int attemptNumber = 3;
        double baseMilliseconds = baseDelay.TotalMilliseconds * Math.Pow(2, attemptNumber - 1);
        int jitterSpan = SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(baseMilliseconds);
        int maxNegativeOffset = -jitterSpan;

        TimeSpan retryDelay = SqlOpenRetryDelayCalculator.Calculate(
            attemptNumber,
            baseDelay,
            maxNegativeOffset);

        retryDelay.Should().BeGreaterThan(TimeSpan.Zero);
    }

    private static void SetInnerException(Exception outer, Exception inner)
    {
        FieldInfo? field = typeof(Exception).GetField(
            "_innerException",
            BindingFlags.NonPublic | BindingFlags.Instance);

        field.Should().NotBeNull("Exception._innerException is required for nested parallel-persist repro shapes");
        field!.SetValue(outer, inner);
    }
}
