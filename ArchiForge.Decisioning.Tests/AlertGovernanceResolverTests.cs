using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Governance.PolicyPacks;

using ArchiForge.Persistence.Alerts.Helpers;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Tests for Alert Governance Resolver.
/// </summary>

[Trait("Category", "Unit")]
public sealed class AlertGovernanceResolverTests
{
    [Fact]
    public async Task ResolveAsync_WhenContextAlreadyHasEffectiveGovernance_DoesNotCallLoader()
    {
        PolicyPackContentDocument preloaded = new();
        AlertEvaluationContext context = new()
        {
            EffectiveGovernanceContent = preloaded,
        };

        Mock<IEffectiveGovernanceLoader> loader = new();

        PolicyPackContentDocument result = await AlertGovernanceResolver.ResolveAsync(context, loader.Object, CancellationToken.None);

        result.Should().BeSameAs(preloaded);
        loader.Verify(
            x => x.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ResolveAsync_WhenContextMissingGovernance_LoadsFromLoader()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        PolicyPackContentDocument loaded = new() { Metadata = { ["k"] = "v" } };

        AlertEvaluationContext context = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            EffectiveGovernanceContent = null,
        };

        Mock<IEffectiveGovernanceLoader> loader = new();
        loader
            .Setup(x => x.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(loaded);

        PolicyPackContentDocument result = await AlertGovernanceResolver.ResolveAsync(context, loader.Object, CancellationToken.None);

        result.Should().BeSameAs(loaded);
        loader.Verify(
            x => x.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
