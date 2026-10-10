using System.ComponentModel;
using System.Net.Http;
using System.Net.Sockets;
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
    public async Task ExecuteAsync_generic_overload_does_not_retry_out_of_memory_exception()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                throw new OutOfMemoryException("simulated");
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<OutOfMemoryException>();
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
    public async Task ExecuteAsync_does_not_retry_aggregate_with_deadlock_and_ioexception_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(deadlock, new IOException("parallel transport read failed"));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_target_invocation_wraps_mixed_parallel_persist_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        TargetInvocationException wrapper = new(
            "reflection invoke failed",
            new AggregateException(deadlock, fkViolation));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw wrapper;
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<TargetInvocationException>();
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
    public async Task ExecuteAsync_does_not_retry_when_two_empty_aggregate_shells_precede_mixed_parallel_persist_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException mixed = new(deadlock, fkViolation);
        AggregateException emptyShellTwo = new AggregateException();
        AggregateException emptyShellOne = new AggregateException();
        SetInnerException(emptyShellTwo, mixed);
        SetInnerException(emptyShellOne, emptyShellTwo);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidOperationException("parallel persist failed", emptyShellOne);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_when_top_level_aggregate_inner_is_nested_aggregate_with_only_transient_sql_inners()
    {
        int attempts = 0;
        SqlException firstDeadlock = SqlExceptionTestFactory.Create(1205);
        SqlException secondDeadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                {
                    throw new AggregateException(
                        new AggregateException(firstDeadlock, secondDeadlock));
                }

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_bare_transient_sql_sibling_pairs_with_wrapped_mixed_nested_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        SqlException bareTransient = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(
                    bareTransient,
                    new InvalidOperationException(
                        "parallel persist failed",
                        new AggregateException(deadlock, fkViolation)));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
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
    public async Task ExecuteAsync_does_not_retry_when_aggregate_lists_reflection_type_load_with_transient_loader_exceptions()
    {
        int attempts = 0;
        SqlException deadlockInLoaderList = SqlExceptionTestFactory.Create(1205);
        ReflectionTypeLoadException reflectionLoad = new(
            Array.Empty<Type>(),
            new Exception[] { deadlockInLoaderList });
        SqlException siblingDeadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(reflectionLoad, siblingDeadlock);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_retries_deadlock_when_top_level_aggregate_nests_transient_only_aggregate()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException nested = new(deadlock, SqlExceptionTestFactory.Create(1204));

        await OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(nested);

                return Task.FromResult(1);
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_top_level_aggregate_nests_transient_only_aggregate()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException nested = new(deadlock, SqlExceptionTestFactory.Create(1204));

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(nested);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_non_transient_sql_unique_constraint_violation()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw SqlExceptionTestFactory.Create(2627);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();

        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_does_not_retry_non_transient_sql_unique_constraint_violation()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                return Task.FromException<int>(SqlExceptionTestFactory.Create(2627));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();

        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_aggregate_lists_type_initialization_exception_wrapping_transient_sql()
    {
        int attempts = 0;
        SqlException transientUnavailable = SqlExceptionTestFactory.Create(40613);
        TypeInitializationException typeInitialization = new("ArchLucid.TestSupport.SimulatedType", transientUnavailable);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(typeInitialization, deadlock);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_azure_sql_unavailable_when_aggregate_inner_is_http_request_exception_wrapper()
    {
        int attempts = 0;
        SqlException unavailable = SqlExceptionTestFactory.Create(40613);
        HttpRequestException httpWrapper = new("azure sql gateway", unavailable);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(httpWrapper);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_after_successful_recovery_from_transient_sql()
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
    public async Task ExecuteAsync_does_not_retry_out_of_memory_exception()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new OutOfMemoryException("simulated");
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<OutOfMemoryException>();

        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_aggregate_lists_type_initialization_with_permanent_sql_beside_deadlock()
    {
        int attempts = 0;
        SqlException permanentViolation = SqlExceptionTestFactory.Create(2627);
        TypeInitializationException typeInitialization = new("ArchLucid.TestSupport.SimulatedType", permanentViolation);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(typeInitialization, deadlock);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_aggregate_sole_inner_is_http_request_without_sql()
    {
        int attempts = 0;
        HttpRequestException httpOnly = new("gateway timeout with no sql inner");

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(httpOnly);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_reflection_type_load_inner_exception_wraps_transient_sql()
    {
        int attempts = 0;
        SqlException transientUnavailable = SqlExceptionTestFactory.Create(40613);
        ReflectionTypeLoadException reflectionLoad = new(Array.Empty<Type>(), Array.Empty<Exception>());
        SetInnerException(reflectionLoad, transientUnavailable);
        SqlException siblingDeadlock = SqlExceptionTestFactory.Create(1205);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(reflectionLoad, siblingDeadlock);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_type_initialization_hides_mixed_nested_aggregate()
    {
        int attempts = 0;
        SqlException permanentViolation = SqlExceptionTestFactory.Create(2627);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException nestedMixed = new AggregateException(permanentViolation, deadlock);
        TypeInitializationException typeInitialization = new("ArchLucid.TestSupport.SimulatedType", nestedMixed);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(typeInitialization);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_deadlock_when_type_initialization_hides_nested_all_transient_aggregate()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException nestedTransient = new AggregateException(deadlock, SqlExceptionTestFactory.Create(1204));
        TypeInitializationException typeInitialization = new("ArchLucid.TestSupport.SimulatedType", nestedTransient);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(typeInitialization);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_does_not_retry_aggregate_with_deadlock_and_task_canceled_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                return Task.FromException<int>(
                    new AggregateException(deadlock, new TaskCanceledException("parallel task canceled")));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_invalid_cast_exception_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidCastException(
                    "parallel persist failed",
                    new AggregateException(deadlock, fkViolation));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidCastException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_invalid_cast_when_permanent_sql_is_listed_first()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new InvalidCastException(
                    "parallel persist failed",
                    new AggregateException(fkViolation, deadlock));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidCastException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_void_and_generic_overloads_match_attempt_counts_for_nested_all_transient_aggregate()
    {
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        AggregateException nested = new(deadlock, SqlExceptionTestFactory.Create(1204));
        int voidAttempts = 0;
        int genericAttempts = 0;

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                voidAttempts++;

                if (voidAttempts == 1)
                    throw new AggregateException(nested);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        await OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                genericAttempts++;

                if (genericAttempts == 1)
                    throw new AggregateException(nested);

                return Task.FromResult(1);
            },
            CancellationToken.None);

        voidAttempts.Should().Be(2);
        genericAttempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_aggregate_with_deadlock_and_argument_exception_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(deadlock, new ArgumentException("validation fault"));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_unauthorized_access_exception_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new UnauthorizedAccessException(
                    "parallel persist failed",
                    new AggregateException(deadlock, fkViolation));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_unauthorized_access_when_permanent_sql_is_listed_first()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new UnauthorizedAccessException(
                    "parallel persist failed",
                    new AggregateException(fkViolation, deadlock));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_when_aggregate_lists_http_wrapper_and_transient_sql_siblings()
    {
        int attempts = 0;
        SqlException unavailable = SqlExceptionTestFactory.Create(40613);
        HttpRequestException httpWrapper = new("azure sql gateway", unavailable);

        await OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts == 1)
                    throw new AggregateException(httpWrapper, unavailable);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_win32_exception_wrapping_socket_exception()
    {
        int attempts = 0;
        Win32Exception win32 = new(10054, "connection reset");
        SetInnerException(win32, new SocketException((int)SocketError.ConnectionReset));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw win32;
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<Win32Exception>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_bare_socket_exception()
    {
        int attempts = 0;

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new SocketException((int)SocketError.ConnectionReset);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SocketException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_non_transient_sql_wrapping_socket_exception()
    {
        int attempts = 0;
        SqlException sqlWithSocketInner = SqlExceptionTestFactory.Create(50000);
        SetInnerException(sqlWithSocketInner, new SocketException((int)SocketError.ConnectionReset));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw sqlWithSocketInner;
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_aggregate_with_deadlock_and_object_disposed_siblings()
    {
        int attempts = 0;
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(deadlock, new ObjectDisposedException("SqlConnection"));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_mixed_aggregate_behind_format_exception_wrapper()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new FormatException(
                    "parallel persist failed",
                    new AggregateException(deadlock, fkViolation));
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<FormatException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_generic_overload_does_not_retry_when_target_invocation_wraps_mixed_parallel_persist_aggregate()
    {
        int attempts = 0;
        SqlException fkViolation = SqlExceptionTestFactory.Create(547);
        SqlException deadlock = SqlExceptionTestFactory.Create(1205);
        TargetInvocationException wrapper = new(
            "reflection invoke failed",
            new AggregateException(deadlock, fkViolation));

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync<int>(
            _ =>
            {
                attempts++;
                return Task.FromException<int>(wrapper);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<TargetInvocationException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_does_not_retry_when_reflection_type_load_has_empty_loader_exceptions_and_sibling_deadlock_only()
    {
        int attempts = 0;
        ReflectionTypeLoadException reflectionLoad = new(Array.Empty<Type>(), Array.Empty<Exception>());
        SqlException siblingDeadlock = SqlExceptionTestFactory.Create(1205);

        Func<Task> act = () => OrchestratorTransientDbRetry.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new AggregateException(reflectionLoad, siblingDeadlock);
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<AggregateException>();
        attempts.Should().Be(1);
    }

    [SkippableFact]
    public async Task ExecuteAsync_retries_when_aggregate_sole_inner_is_target_invocation_wrapping_all_transient_nested_aggregate()
    {
        int attempts = 0;
        SqlException firstDeadlock = SqlExceptionTestFactory.Create(1205);
        SqlException secondDeadlock = SqlExceptionTestFactory.Create(1204);
        TargetInvocationException wrapper = new(
            "reflection invoke failed",
            new AggregateException(firstDeadlock, secondDeadlock));

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
