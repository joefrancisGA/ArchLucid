using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class SqlFirstSessionLifecycleHookTests
{
    [Fact]
    public async Task OnSuccessfulManifestCommitAsync_noops_for_empty_tenant()
    {
        Mock<ITenantOnboardingStateRepository> repository = new(MockBehavior.Strict);

        SqlFirstSessionLifecycleHook sut = new(repository.Object);

        await sut.OnSuccessfulManifestCommitAsync(Guid.Empty, CancellationToken.None);

        repository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task OnSuccessfulManifestCommitAsync_records_metrics_only_on_first_session(bool first)
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantOnboardingStateRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(r => r.TryMarkFirstSessionCompletedAsync(tenantId, CancellationToken.None))
            .ReturnsAsync(first);

        Counter<long> sessionCounter = ArchLucidInstrumentation.FirstSessionCompletedTotal;
        Counter<long> taskCounter = ArchLucidInstrumentation.OperatorTaskSuccessTotal;
        using MeterListener listener = new();
        // Measurements are synchronous; the execution-context marker excludes
        // unrelated measurements from parallel tests using the process-wide meter.
        AsyncLocal<bool> observing = new();
        long sessions = 0;
        long tasks = 0;
        listener.InstrumentPublished = (instrument, owner) =>
        {
            if (ReferenceEquals(instrument, sessionCounter) || ReferenceEquals(instrument, taskCounter))
                owner.EnableMeasurementEvents(instrument);
        };
        listener.SetMeasurementEventCallback<long>((instrument, value, tags, _) =>
        {
            if (!observing.Value)
                return;
            if (ReferenceEquals(instrument, sessionCounter))
                sessions += value;
            else if (ReferenceEquals(instrument, taskCounter))
            {
                foreach (KeyValuePair<string, object?> tag in tags)
                {
                    if (tag.Key == "task" && Equals(tag.Value, "first_run_committed"))
                        tasks += value;
                }
            }
        });
        listener.Start();
        SqlFirstSessionLifecycleHook sut = new(repository.Object);
        observing.Value = true;
        try
        {
            await sut.OnSuccessfulManifestCommitAsync(tenantId, CancellationToken.None);
        }
        finally
        {
            observing.Value = false;
        }

        repository.Verify(r => r.TryMarkFirstSessionCompletedAsync(tenantId, CancellationToken.None), Times.Once);
        sessions.Should().Be(first ? 1L : 0L);
        tasks.Should().Be(first ? 1L : 0L);
    }
}
