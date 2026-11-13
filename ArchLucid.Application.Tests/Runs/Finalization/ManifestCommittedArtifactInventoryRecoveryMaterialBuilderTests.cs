using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Finalization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestCommittedArtifactInventoryRecoveryMaterialBuilderTests
{
    [Fact]
    public async Task LoadVerifiedBundleAsync_allows_distinct_execution_manifest_when_run_and_scope_match()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.NewGuid();
        Guid bundleId = Guid.NewGuid();
        RunRecord header = NewHeader(scope, runId, bundleId);
        header.GoldenManifestId = Guid.NewGuid(); // committed manifest differs from execution manifest
        ArtifactBundle saved = NewBundle(scope, runId, bundleId);
        saved.ManifestId = Guid.NewGuid();

        Mock<IArtifactBundleRepository> repository = new();
        repository.Setup(r => r.GetByBundleIdInScopeAsync(
                scope, bundleId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(saved);

        ArtifactBundle result = await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.LoadVerifiedBundleAsync(
            scope, header, repository.Object, CancellationToken.None);

        result.Should().BeSameAs(saved);
        repository.Verify(r => r.GetByBundleIdInScopeAsync(
            scope, bundleId, true, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoadVerifiedBundleAsync_missing_bundle_fails_closed()
    {
        ScopeContext scope = NewScope();
        Guid bundleId = Guid.NewGuid();
        RunRecord header = NewHeader(scope, Guid.NewGuid(), bundleId);
        Mock<IArtifactBundleRepository> repository = new();

        Func<Task> act = async () => await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.LoadVerifiedBundleAsync(
            scope, header, repository.Object, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task LoadVerifiedBundleAsync_rejects_bundle_from_other_run()
    {
        ScopeContext scope = NewScope();
        Guid bundleId = Guid.NewGuid();
        RunRecord header = NewHeader(scope, Guid.NewGuid(), bundleId);
        Mock<IArtifactBundleRepository> repository = new();
        repository.Setup(r => r.GetByBundleIdInScopeAsync(
                scope, bundleId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NewBundle(scope, Guid.NewGuid(), bundleId));

        Func<Task> act = async () => await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.LoadVerifiedBundleAsync(
            scope, header, repository.Object, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task LoadVerifiedBundleAsync_rejects_header_outside_scope_before_repository_call()
    {
        ScopeContext scope = NewScope();
        RunRecord header = NewHeader(scope, Guid.NewGuid(), Guid.NewGuid());
        header.ScopeProjectId = Guid.NewGuid();
        Mock<IArtifactBundleRepository> repository = new();

        Func<Task> act = async () => await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.LoadVerifiedBundleAsync(
            scope, header, repository.Object, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task LoadVerifiedBundleAsync_rejects_bundle_identity_mismatch()
    {
        ScopeContext scope = NewScope();
        Guid bundleId = Guid.NewGuid();
        RunRecord header = NewHeader(scope, Guid.NewGuid(), bundleId);
        Mock<IArtifactBundleRepository> repository = new();
        repository.Setup(r => r.GetByBundleIdInScopeAsync(
                scope, bundleId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NewBundle(scope, header.RunId, Guid.NewGuid()));

        Func<Task> act = async () => await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.LoadVerifiedBundleAsync(
            scope, header, repository.Object, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid()
    };

    private static RunRecord NewHeader(ScopeContext scope, Guid runId, Guid bundleId) => new()
    {
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ScopeProjectId = scope.ProjectId,
        RunId = runId,
        ArtifactBundleId = bundleId
    };

    private static ArtifactBundle NewBundle(ScopeContext scope, Guid runId, Guid bundleId) => new()
    {
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        RunId = runId,
        BundleId = bundleId,
        ManifestId = Guid.NewGuid()
    };
}
