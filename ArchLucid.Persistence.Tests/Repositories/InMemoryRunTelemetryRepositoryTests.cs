using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunTelemetryRepositoryTests
{
    [Fact]
    public async Task InsertCommitMetricsIfAbsentAsync_completes_for_valid_request()
    {
        InMemoryRunTelemetryRepository sut = new();
        RunCommitTelemetryWriteRequest request = new(
            Guid.NewGuid(),
            RequestDurationMs: 100,
            AgentExecutionDurationMs: 80,
            ManualReviewDurationMs: 20,
            EstimatedHoursSaved: 1.5m);

        await sut.Invoking(s => s.InsertCommitMetricsIfAbsentAsync(request, CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task InsertCommitMetricsIfAbsentAsync_rejects_null_request()
    {
        InMemoryRunTelemetryRepository sut = new();

        Func<Task> act = () => sut.InsertCommitMetricsIfAbsentAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
