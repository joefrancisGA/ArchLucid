using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Polly;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlResilientOperationExecutorTests
{
    [Fact]
    public async Task ExecuteAsync_transient_exception_retries_then_succeeds()
    {
        int attempts = 0;
        ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
            maxRetryAttempts: 2,
            baseDelay: TimeSpan.FromMilliseconds(1));

        SqlResilientOperationExecutor sut = new(pipeline);

        await sut.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts < 2)
                    throw new TimeoutException("transient");

                return Task.CompletedTask;
            },
            CancellationToken.None);

        attempts.Should().Be(2);
    }

    [Fact]
    public async Task ExecuteAsync_with_result_returns_value_after_retry()
    {
        int attempts = 0;
        ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
            maxRetryAttempts: 1,
            baseDelay: TimeSpan.FromMilliseconds(1));

        SqlResilientOperationExecutor sut = new(pipeline);

        int value = await sut.ExecuteAsync(
            _ =>
            {
                attempts++;

                if (attempts < 2)
                    throw new TimeoutException("transient");

                return Task.FromResult(42);
            },
            CancellationToken.None);

        value.Should().Be(42);
        attempts.Should().Be(2);
    }
}
