using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectDiffConsumerTests
{
    [Fact]
    public async Task OnDiffComputedAsync_empty_changes_does_not_invoke_runner()
    {
        Mock<ISecureNowArchitectNeighborhoodRunner> runner = new();
        SecureNowArchitectDiffConsumer sut = CreateConsumer(fullRecompute: false, runner);

        await sut.OnDiffComputedAsync(
            new AzureInventoryDiffSummaryRecord
            {
                DiffId = Guid.NewGuid(),
                SnapshotAId = Guid.NewGuid(),
                SnapshotBId = Guid.NewGuid(),
            },
            [],
            CancellationToken.None);

        runner.Verify(
            service => service.RecomputeNeighborhoodAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                It.IsAny<AzureInventoryDiffSummaryRecord>(),
                It.IsAny<IReadOnlyList<AzureInventoryChangeRecord>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task OnDiffComputedAsync_full_recompute_skips_runner()
    {
        Mock<ISecureNowArchitectNeighborhoodRunner> runner = new();
        SecureNowArchitectDiffConsumer sut = CreateConsumer(fullRecompute: true, runner);

        await sut.OnDiffComputedAsync(
            new AzureInventoryDiffSummaryRecord
            {
                DiffId = Guid.NewGuid(),
                SnapshotAId = Guid.NewGuid(),
                SnapshotBId = Guid.NewGuid(),
            },
            [
                new AzureInventoryChangeRecord
                {
                    ChangeId = Guid.NewGuid(),
                    ChangeType = AzureInventoryChangeType.PermissionChanged,
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            CancellationToken.None);

        runner.Verify(
            service => service.RecomputeNeighborhoodAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                It.IsAny<AzureInventoryDiffSummaryRecord>(),
                It.IsAny<IReadOnlyList<AzureInventoryChangeRecord>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static SecureNowArchitectDiffConsumer CreateConsumer(
        bool fullRecompute,
        Mock<ISecureNowArchitectNeighborhoodRunner> runner)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ArchLucid.Core.Scoping.ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        IOptions<SecureNowArchitectNeighborhoodOptions> options = Options.Create(
            new SecureNowArchitectNeighborhoodOptions { FullRecompute = fullRecompute });

        return new SecureNowArchitectDiffConsumer(scopeProvider.Object, options, runner.Object);
    }
}
