using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureExtractorAutoPullOrchestratorTests
{
    [Fact]
    public async Task RunScheduledPullAsync_skips_subscription_when_lock_is_held()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync([tenant]);
        tenantRepository
            .Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.NewGuid(),
                DefaultProjectId = Guid.NewGuid(),
            });

        Mock<ITenantHostedExtractorConfigurationRepository> configRepository = new();
        configRepository
            .Setup(r => r.ListByTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new TenantHostedExtractorConfigurationRecord
                {
                    TenantId = tenantId,
                    SubscriptionId = "sub-001",
                    CustomerTenantId = Guid.NewGuid().ToString(),
                    CustomerAppId = Guid.NewGuid().ToString(),
                    IncludeCost = false,
                },
            ]);

        Mock<IHostedAzureExtractorRunService> runService = new();

        Mock<IDistributedCreateRunIdempotencyLock> distributedLock = new();
        distributedLock
            .Setup(l => l.AcquireExclusiveSessionLockAsync(It.IsAny<string>(), 0, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("lock busy"));

        AzureExtractorAutoPullOrchestrator sut = new(
            tenantRepository.Object,
            configRepository.Object,
            runService.Object,
            distributedLock.Object,
            CreateAutoPullOptionsMonitor(),
            NullLogger<AzureExtractorAutoPullOrchestrator>.Instance);

        await sut.RunScheduledPullAsync(CancellationToken.None);

        runService.Verify(
            s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunScheduledPullAsync_executes_pull_when_lock_acquired()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync([tenant]);
        tenantRepository
            .Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.NewGuid(),
                DefaultProjectId = Guid.NewGuid(),
            });

        Mock<ITenantHostedExtractorConfigurationRepository> configRepository = new();
        configRepository
            .Setup(r => r.ListByTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new TenantHostedExtractorConfigurationRecord
                {
                    TenantId = tenantId,
                    SubscriptionId = "sub-001",
                    CustomerTenantId = Guid.NewGuid().ToString(),
                    CustomerAppId = Guid.NewGuid().ToString(),
                    IncludeCost = false,
                },
            ]);

        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                tenantId,
                "sub-001",
                null,
                "hosted:azure-extractor-auto-pull",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateSuccess(Guid.NewGuid(), 12));

        Mock<IDistributedCreateRunIdempotencyLock> distributedLock = new();
        distributedLock
            .Setup(l => l.AcquireExclusiveSessionLockAsync(It.IsAny<string>(), 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NoOpAsyncDisposable());

        AzureExtractorAutoPullOrchestrator sut = new(
            tenantRepository.Object,
            configRepository.Object,
            runService.Object,
            distributedLock.Object,
            CreateAutoPullOptionsMonitor(),
            NullLogger<AzureExtractorAutoPullOrchestrator>.Instance);

        await sut.RunScheduledPullAsync(CancellationToken.None);

        runService.Verify(
            s => s.RunAsync(
                tenantId,
                "sub-001",
                null,
                "hosted:azure-extractor-auto-pull",
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RunScheduledPullAsync_continues_pass_when_subscription_is_throttled()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Contoso",
            Slug = "contoso",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync([tenant]);
        tenantRepository
            .Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.NewGuid(),
                DefaultProjectId = Guid.NewGuid(),
            });

        Mock<ITenantHostedExtractorConfigurationRepository> configRepository = new();
        configRepository
            .Setup(r => r.ListByTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new TenantHostedExtractorConfigurationRecord
                {
                    TenantId = tenantId,
                    SubscriptionId = "sub-throttled",
                    CustomerTenantId = Guid.NewGuid().ToString(),
                    CustomerAppId = Guid.NewGuid().ToString(),
                    IncludeCost = false,
                },
                new TenantHostedExtractorConfigurationRecord
                {
                    TenantId = tenantId,
                    SubscriptionId = "sub-ok",
                    CustomerTenantId = Guid.NewGuid().ToString(),
                    CustomerAppId = Guid.NewGuid().ToString(),
                    IncludeCost = false,
                },
            ]);

        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                tenantId,
                "sub-throttled",
                null,
                "hosted:azure-extractor-auto-pull",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateThrottled("HTTP 429 after retries."));
        runService
            .Setup(s => s.RunAsync(
                tenantId,
                "sub-ok",
                null,
                "hosted:azure-extractor-auto-pull",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateSuccess(Guid.NewGuid(), 3));

        Mock<IDistributedCreateRunIdempotencyLock> distributedLock = new();
        distributedLock
            .Setup(l => l.AcquireExclusiveSessionLockAsync(It.IsAny<string>(), 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NoOpAsyncDisposable());

        AzureExtractorAutoPullOrchestrator sut = new(
            tenantRepository.Object,
            configRepository.Object,
            runService.Object,
            distributedLock.Object,
            CreateAutoPullOptionsMonitor(subscriptionCooldownSeconds: 0),
            NullLogger<AzureExtractorAutoPullOrchestrator>.Instance);

        await sut.RunScheduledPullAsync(CancellationToken.None);

        runService.Verify(
            s => s.RunAsync(
                tenantId,
                "sub-ok",
                null,
                "hosted:azure-extractor-auto-pull",
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static IOptionsMonitor<AzureExtractorAutoPullOptions> CreateAutoPullOptionsMonitor(
        int subscriptionCooldownSeconds = 0)
    {
        Mock<IOptionsMonitor<AzureExtractorAutoPullOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new AzureExtractorAutoPullOptions
        {
            Enabled = true,
            IntervalMinutes = 360,
            SubscriptionCooldownSeconds = subscriptionCooldownSeconds,
        });

        return options.Object;
    }

    private sealed class NoOpAsyncDisposable : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
