using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     TB-588 — commit path passes preloaded scope assignments so governance snapshot capture does not re-query SQL.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedEffectiveGovernanceSnapshotCapturerPreloadTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
    };

    [Fact]
    public async Task ApplyToManifestAsync_with_preloaded_assignments_skips_policy_pack_assignment_repository_reads()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(static r => r.ResolveAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new EffectiveGovernanceResolutionResult
                {
                    EffectiveContent = new PolicyPackContentDocument { ComplianceRuleKeys = [] },
                    Conflicts = []
                });

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(static r => r.GetByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPack>());

        CommittedEffectiveGovernanceSnapshotCapturer sut = new(
            scopeProvider.Object,
            resolver.Object,
            assignments.Object,
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>());

        ManifestDocument manifest = new() { RuleSetId = "rs", RuleSetVersion = "1", RuleSetHash = "hash" };

        await sut.ApplyToManifestAsync(
            manifest,
            new CommittedEffectiveGovernanceSnapshotCaptureOptions
            {
                PreloadedScopePolicyPackAssignments = []
            },
            CancellationToken.None);

        assignments.Verify(
            static r => r.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
