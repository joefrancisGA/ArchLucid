using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Contracts.Abstractions.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;
using System.Net;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostedAzureExtractorRunServiceTests
{
    [Fact]
    public async Task RunAsync_when_disabled_returns_feature_disabled()
    {
        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions { Enabled = false });

        HostedAzureExtractorRunService sut = new(
            Mock.Of<ITenantHostedExtractorConfigurationRepository>(),
            Mock.Of<IHostedAzureExtractorClient>(),
            Mock.Of<IAzureExtractorIngestService>(),
            options.Object);

        HostedAzureExtractorRunResult result = await sut.RunAsync(
            Guid.NewGuid(),
            "sub-1",
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedAzureExtractorRunFailureKind.FeatureDisabled);
    }

    [Fact]
    public async Task RunAsync_when_configured_collects_and_ingests()
    {
        Guid tenantId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        Mock<ITenantHostedExtractorConfigurationRepository> configRepo = new();
        configRepo
            .Setup(r => r.TryGetAsync(tenantId, "sub-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHostedExtractorConfigurationRecord
            {
                CustomerTenantId = "cust",
                CustomerAppId = "app",
                SubscriptionId = "sub-1",
                IncludeCost = true,
            });

        Mock<IHostedAzureExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedAzureExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAzureExtractorCollectionResult
            {
                ZipBytes = [1, 2, 3],
                OriginalFileName = "extract.zip",
                ResourceCount = 4,
            });

        Mock<IAzureExtractorIngestService> ingest = new();
        ingest
            .Setup(i => i.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>(),
                It.IsAny<long>()))
            .ReturnsAsync(new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId });

        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions { Enabled = true });

        HostedAzureExtractorRunService sut = new(
            configRepo.Object,
            client.Object,
            ingest.Object,
            options.Object);

        HostedAzureExtractorRunResult result = await sut.RunAsync(
            tenantId,
            "sub-1",
            null,
            "actor",
            "corr",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(4);
    }

    [Fact]
    public async Task RunAsync_when_arm_is_throttled_returns_throttled_failure_kind()
    {
        Guid tenantId = Guid.NewGuid();

        Mock<ITenantHostedExtractorConfigurationRepository> configRepo = new();
        configRepo
            .Setup(r => r.TryGetAsync(tenantId, "sub-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHostedExtractorConfigurationRecord
            {
                CustomerTenantId = "cust",
                CustomerAppId = "app",
                SubscriptionId = "sub-1",
                IncludeCost = false,
            });

        Mock<IHostedAzureExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedAzureExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Too Many Requests", inner: null, statusCode: HttpStatusCode.TooManyRequests));

        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions { Enabled = true });

        HostedAzureExtractorRunService sut = new(
            configRepo.Object,
            client.Object,
            Mock.Of<IAzureExtractorIngestService>(),
            options.Object);

        HostedAzureExtractorRunResult result = await sut.RunAsync(
            tenantId,
            "sub-1",
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedAzureExtractorRunFailureKind.Throttled);
    }

    [Fact]
    public async Task RunAsync_two_collection_phases_share_one_deadline()
    {
        FakeTimeProvider clock = new();
        TaskCompletionSource secondPhaseStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        HostedAzureExtractorRunService sut = BuildTimedService(clock, async token =>
        {
            await Task.Delay(TimeSpan.FromSeconds(40), clock, token);
            Task secondPhase = Task.Delay(TimeSpan.FromSeconds(40), clock, token);
            secondPhaseStarted.SetResult();
            await secondPhase;

            return SampleCollection();
        }, out Mock<IAzureExtractorIngestService> ingest);

        Task<HostedAzureExtractorRunResult> pending = StartRun(sut);
        clock.Advance(TimeSpan.FromSeconds(40));
        await secondPhaseStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        clock.Advance(TimeSpan.FromSeconds(19));
        Assert.False(pending.IsCompleted);

        clock.Advance(TimeSpan.FromSeconds(1));

        HostedAzureExtractorRunResult result = await pending.WaitAsync(TimeSpan.FromSeconds(5));
        AssertDeadlineFailure(result);
        ingest.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RunAsync_late_zip_is_never_ingested_even_if_the_collector_ignores_cancellation()
    {
        FakeTimeProvider clock = new();
        TaskCompletionSource<HostedAzureExtractorCollectionResult> collected =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        CancellationToken observed = default;
        HostedAzureExtractorRunService sut = BuildTimedService(clock, token =>
        {
            observed = token;

            return collected.Task;
        }, out Mock<IAzureExtractorIngestService> ingest);

        Task<HostedAzureExtractorRunResult> pending = StartRun(sut);
        clock.Advance(TimeSpan.FromSeconds(60));
        Assert.True(observed.IsCancellationRequested);
        collected.SetResult(SampleCollection());

        AssertDeadlineFailure(await pending.WaitAsync(TimeSpan.FromSeconds(5)));
        ingest.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RunAsync_caller_cancellation_is_not_reported_as_a_collection_timeout(bool alsoExpireDeadline)
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        TaskCompletionSource<HostedAzureExtractorCollectionResult> collection =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        CancellationToken observed = default;
        HostedAzureExtractorRunService sut = BuildTimedService(clock, token =>
        {
            observed = token;

            return collection.Task;
        }, out Mock<IAzureExtractorIngestService> ingest);

        Task<HostedAzureExtractorRunResult> pending = StartRun(sut, caller.Token);
        await caller.CancelAsync();
        Assert.True(observed.IsCancellationRequested);

        if (alsoExpireDeadline)
            clock.Advance(TimeSpan.FromSeconds(60));

        collection.SetCanceled(observed);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending.WaitAsync(TimeSpan.FromSeconds(5)));
        ingest.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RunAsync_collection_deadline_does_not_cancel_an_ingest_started_after_a_complete_zip()
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        HostedAzureExtractorRunService sut = BuildTimedService(
            clock, _ => Task.FromResult(SampleCollection()), out Mock<IAzureExtractorIngestService> ingest);
        Guid packageId = Guid.NewGuid();
        TaskCompletionSource<AzureExtractorIngestResult> persisted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        ingest.Setup(i => i.IngestZipBytesAsync(It.IsAny<byte[]>(), It.IsAny<string>(),
                It.IsAny<Guid?>(), caller.Token, It.IsAny<string?>(), It.IsAny<long>()))
            .Returns(persisted.Task);

        Task<HostedAzureExtractorRunResult> pending = StartRun(sut, caller.Token);
        ingest.VerifyAll();
        clock.Advance(TimeSpan.FromSeconds(60));
        Assert.False(pending.IsCompleted);
        persisted.SetResult(new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId });

        HostedAzureExtractorRunResult result = await pending.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.True(result.Succeeded);
        Assert.Equal(packageId, result.PackageId);
        Assert.False(caller.IsCancellationRequested);
    }

    [Theory]
    [InlineData(0, 30)]
    [InlineData(61, 61)]
    [InlineData(int.MaxValue, 7_200)]
    public void Collection_timeout_setting_is_bounded(int configuredSeconds, int effectiveSeconds)
    {
        HostedAzureExtractorOptions options = new() { CollectionTimeoutSeconds = configuredSeconds };

        Assert.Equal(TimeSpan.FromSeconds(effectiveSeconds), options.GetEffectiveCollectionTimeout());
        Assert.Equal(TimeSpan.FromMinutes(30), new HostedAzureExtractorOptions().GetEffectiveCollectionTimeout());
    }

    private static void AssertDeadlineFailure(HostedAzureExtractorRunResult result)
    {
        Assert.False(result.Succeeded);
        Assert.Equal(HostedAzureExtractorRunFailureKind.CollectionFailed, result.FailureKind);
        Assert.Contains("60-second deadline", result.FailureDetail);
        Assert.Null(result.PackageId);
    }

    private static Task<HostedAzureExtractorRunResult> StartRun(
        HostedAzureExtractorRunService sut, CancellationToken cancellationToken = default) =>
        sut.RunAsync(Guid.NewGuid(), "sub-1", null, "actor", null, cancellationToken);

    private static HostedAzureExtractorCollectionResult SampleCollection() =>
        new() { ZipBytes = [1, 2, 3], OriginalFileName = "extract.zip", ResourceCount = 4 };

    private static HostedAzureExtractorRunService BuildTimedService(
        TimeProvider clock, Func<CancellationToken, Task<HostedAzureExtractorCollectionResult>> collect,
        out Mock<IAzureExtractorIngestService> ingest)
    {
        Mock<ITenantHostedExtractorConfigurationRepository> configurations = new();
        configurations.Setup(r => r.TryGetAsync(It.IsAny<Guid>(), "sub-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHostedExtractorConfigurationRecord
            {
                CustomerTenantId = "cust",
                CustomerAppId = "app",
                SubscriptionId = "sub-1",
            });
        Mock<IHostedAzureExtractorClient> collector = new();
        collector.Setup(c => c.CollectZipAsync(
                It.IsAny<HostedAzureExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .Returns((HostedAzureExtractorCollectionRequest _, CancellationToken token) => collect(token));
        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions
        {
            Enabled = true,
            CollectionTimeoutSeconds = 60,
        });
        ingest = new Mock<IAzureExtractorIngestService>(MockBehavior.Strict);

        return new HostedAzureExtractorRunService(configurations.Object, collector.Object, ingest.Object, options.Object, clock);
    }
}
