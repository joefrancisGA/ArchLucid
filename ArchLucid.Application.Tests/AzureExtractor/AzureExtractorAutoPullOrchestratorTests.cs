using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

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

    private sealed class NoOpAsyncDisposable : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
