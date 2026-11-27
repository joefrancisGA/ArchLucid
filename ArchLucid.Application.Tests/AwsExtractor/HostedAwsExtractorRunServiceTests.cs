using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;

using Microsoft.AspNetCore.Http;
using ArchLucid.Persistence.AwsExtractor;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostedAwsExtractorRunServiceTests
{
    private static readonly TimeSpan TestWait = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan CollectionBudget = TimeSpan.FromSeconds(60);

    [Fact]
    public async Task RunAsync_when_disabled_returns_feature_disabled()
    {
        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = false });

        HostedAwsExtractorRunService sut = CreateSut(options: options.Object);

        HostedAwsExtractorRunResult result = await sut.RunAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedAwsExtractorRunFailureKind.FeatureDisabled);
    }

    [Fact]
    public async Task RunAsync_when_configured_collects_and_ingests()
    {
        Guid tenantId = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        InMemoryTenantAwsConnectionRepository connectionRepository = new();
        await connectionRepository.UpsertAsync(
            new TenantAwsConnectionRecord
            {
                ConnectionId = connectionId,
                TenantId = tenantId,
                AccountId = "123456789012",
                Region = "us-east-1",
                RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
                Status = AwsConnectionStatus.Connected,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "seed"
            },
            CancellationToken.None);

        Mock<IHostedAwsExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedAwsExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAwsExtractorCollectionResult
            {
                ZipBytes = [1, 2, 3],
                OriginalFileName = "aws-inventory.zip",
                ResourceCount = 7
            });

        Mock<ICloudInventoryExtractorIngestService> ingest = new();
        ingest
            .Setup(i => i.IngestZipAsync(
                CloudProvider.Aws,
                It.IsAny<IFormFile>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new CloudInventoryExtractorIngestResult { Succeeded = true, PackageId = packageId });

        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = true });

        HostedAwsExtractorRunService sut = CreateSut(
            connectionRepository,
            client.Object,
            ingest.Object,
            options.Object);

        HostedAwsExtractorRunResult result = await sut.RunAsync(
            tenantId,
            connectionId,
            null,
            "actor",
            "corr",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(7);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RunAsync_collection_deadline_does_not_ingest_a_timed_out_or_late_zip(bool ignoresCancellation)
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        TaskCompletionSource<HostedAwsExtractorCollectionResult> collected = new(TaskCreationOptions.RunContinuationsAsynchronously);
        CancellationToken observed = default;
        HostedAwsExtractorRunService service = BuildTimedService(clock, token =>
        {
            observed = token;

            return ignoresCancellation ? collected.Task : collected.Task.WaitAsync(token);
        }, out Mock<ICloudInventoryExtractorIngestService> ingest, out Mock<ITenantAwsConnectionRepository> repository);

        Guid tenantId = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        Task<HostedAwsExtractorRunResult> pending = service.RunAsync(tenantId, connectionId, null, "actor", null, caller.Token);
        Assert.True(observed.CanBeCanceled);
        Assert.NotEqual(caller.Token, observed);
        clock.Advance(CollectionBudget - TimeSpan.FromSeconds(1));
        Assert.False(observed.IsCancellationRequested);
        Assert.False(pending.IsCompleted);
        clock.Advance(TimeSpan.FromSeconds(1));
        Assert.True(observed.IsCancellationRequested);

        if (ignoresCancellation)
        {
            Assert.False(pending.IsCompleted);
            collected.SetResult(SampleCollection());
        }

        HostedAwsExtractorRunResult result = await pending.WaitAsync(TestWait);
        Assert.Equal(HostedAwsExtractorRunFailureKind.CollectionFailed, result.FailureKind);
        Assert.Contains("Hosted AWS collection exceeded its 60-second deadline", result.FailureDetail);
        Assert.Null(result.PackageId);
        Assert.False(caller.IsCancellationRequested);
        repository.Verify(r => r.UpdateStatusAsync(
            tenantId, connectionId, AwsConnectionStatus.Error, null, "actor", caller.Token), Times.Once);
        ingest.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RunAsync_caller_cancellation_is_not_a_collection_timeout(bool expireBudget)
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        TaskCompletionSource<HostedAwsExtractorCollectionResult> collected = new(TaskCreationOptions.RunContinuationsAsynchronously);
        CancellationToken observed = default;
        HostedAwsExtractorRunService service = BuildTimedService(clock, token =>
        {
            observed = token;

            return collected.Task;
        }, out Mock<ICloudInventoryExtractorIngestService> ingest, out Mock<ITenantAwsConnectionRepository> repository);

        Task<HostedAwsExtractorRunResult> pending = service.RunAsync(
            Guid.NewGuid(), Guid.NewGuid(), null, "actor", null, caller.Token);
        await caller.CancelAsync();
        Assert.True(observed.IsCancellationRequested);

        if (expireBudget)
            clock.Advance(CollectionBudget);

        collected.SetCanceled(observed);

        OperationCanceledException cancellation =
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending.WaitAsync(TestWait));
        Assert.Equal(caller.Token, cancellation.CancellationToken);
        repository.Verify(r => r.UpdateStatusAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(), AwsConnectionStatus.Error, It.IsAny<DateTimeOffset?>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        ingest.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RunAsync_collection_deadline_does_not_cancel_ingest_in_progress()
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        HostedAwsExtractorRunService service = BuildTimedService(clock, _ => Task.FromResult(SampleCollection()),
            out Mock<ICloudInventoryExtractorIngestService> ingest, out _);
        Guid packageId = Guid.NewGuid();
        TaskCompletionSource<CloudInventoryExtractorIngestResult> persisted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        ingest.Setup(i => i.IngestZipAsync(
                CloudProvider.Aws, It.IsAny<IFormFile>(), It.IsAny<Guid?>(), caller.Token, It.IsAny<string?>()))
            .Returns(persisted.Task);

        Task<HostedAwsExtractorRunResult> pending = service.RunAsync(
            Guid.NewGuid(), Guid.NewGuid(), null, "actor", null, caller.Token);
        ingest.VerifyAll();
        clock.Advance(CollectionBudget);
        Assert.False(pending.IsCompleted);
        persisted.SetResult(new CloudInventoryExtractorIngestResult { Succeeded = true, PackageId = packageId });

        HostedAwsExtractorRunResult result = await pending.WaitAsync(TestWait);
        Assert.True(result.Succeeded);
        Assert.Equal(packageId, result.PackageId);
        Assert.False(caller.IsCancellationRequested);
    }

    [Fact]
    public async Task RunAsync_throttling_before_deadline_keeps_existing_failure_kind()
    {
        FakeTimeProvider clock = new();
        HostedAwsExtractorRunService service = BuildTimedService(clock,
            _ => Task.FromException<HostedAwsExtractorCollectionResult>(new InvalidOperationException("Throttling: synthetic provider limit")),
            out Mock<ICloudInventoryExtractorIngestService> ingest, out _);

        HostedAwsExtractorRunResult result = await service.RunAsync(
            Guid.NewGuid(), Guid.NewGuid(), null, "actor", null, CancellationToken.None);

        Assert.Equal(HostedAwsExtractorRunFailureKind.Throttled, result.FailureKind);
        ingest.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(0, 30)]
    [InlineData(61, 61)]
    [InlineData(int.MaxValue, 7_200)]
    public void Collection_timeout_setting_is_bounded(int configuredSeconds, int effectiveSeconds)
    {
        HostedAwsExtractorOptions options = new() { CollectionTimeoutSeconds = configuredSeconds };

        Assert.Equal(TimeSpan.FromSeconds(effectiveSeconds), options.GetEffectiveCollectionTimeout());
        Assert.Equal(TimeSpan.FromMinutes(30), new HostedAwsExtractorOptions().GetEffectiveCollectionTimeout());
    }

    private static HostedAwsExtractorCollectionResult SampleCollection() =>
        new() { ZipBytes = [1, 2, 3], OriginalFileName = "inventory.zip", ResourceCount = 1 };

    private static HostedAwsExtractorRunService BuildTimedService(
        TimeProvider clock,
        Func<CancellationToken, Task<HostedAwsExtractorCollectionResult>> collect,
        out Mock<ICloudInventoryExtractorIngestService> ingest,
        out Mock<ITenantAwsConnectionRepository> repository)
    {
        repository = new();
        repository.Setup(r => r.TryGetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantAwsConnectionRecord
            {
                AccountId = "123456789012",
                Region = "us-east-1",
                RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
                Status = AwsConnectionStatus.Connected,
                UpdatedByActorId = "seed",
            });

        Mock<IHostedAwsExtractorClient> collector = new();
        collector.Setup(c => c.CollectZipAsync(It.IsAny<HostedAwsExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .Returns((HostedAwsExtractorCollectionRequest _, CancellationToken token) => collect(token));
        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions
        {
            Enabled = true,
            CollectionTimeoutSeconds = (int)CollectionBudget.TotalSeconds,
        });
        ingest = new Mock<ICloudInventoryExtractorIngestService>(MockBehavior.Strict);

        return CreateSut(repository.Object, collector.Object, ingest.Object, options.Object, clock);
    }

    private static HostedAwsExtractorRunService CreateSut(
        ITenantAwsConnectionRepository? connectionRepository = null,
        IHostedAwsExtractorClient? hostedClient = null,
        ICloudInventoryExtractorIngestService? ingestService = null,
        IOptionsMonitor<HostedAwsExtractorOptions>? options = null,
        TimeProvider? timeProvider = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> defaultOptions = new();
        defaultOptions.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = false });

        return new HostedAwsExtractorRunService(
            connectionRepository ?? Mock.Of<ITenantAwsConnectionRepository>(),
            hostedClient ?? Mock.Of<IHostedAwsExtractorClient>(),
            ingestService ?? Mock.Of<ICloudInventoryExtractorIngestService>(),
            scope.Object,
            Mock.Of<IAuditService>(),
            options ?? defaultOptions.Object,
            timeProvider);
    }
}
