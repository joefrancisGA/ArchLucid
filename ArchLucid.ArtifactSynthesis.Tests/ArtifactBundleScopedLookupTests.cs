using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactBundleScopedLookupTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task GetByManifestIdAsync_uses_creation_time_and_prefers_the_last_save_when_creation_times_tie(
        bool creationTimesTie)
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        Guid manifestId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 11, 21, 12, 0, 0, DateTimeKind.Utc);

        ArtifactBundle firstSaved = MakeBundle(createdUtc);
        ArtifactBundle lastSaved = MakeBundle(creationTimesTie ? createdUtc : createdUtc.AddMinutes(-1));
        await repository.SaveAsync(firstSaved, CancellationToken.None);
        await repository.SaveAsync(lastSaved, CancellationToken.None);

        ArtifactBundle? result = await repository.GetByManifestIdAsync(
            scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        result.Should().BeSameAs(creationTimesTie ? lastSaved : firstSaved);

        ArtifactBundle MakeBundle(DateTime timestamp) => new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ManifestId = manifestId,
            CreatedUtc = timestamp
        };
    }

    [Fact]
    public async Task GetByBundleIdInScopeAsync_uses_recorded_identity_and_enforces_three_part_scope()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Guid bundleId = Guid.NewGuid();
        Guid executionManifestId = Guid.NewGuid();
        ArtifactBundle saved = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = Guid.NewGuid(),
            ManifestId = executionManifestId,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactType = ArtifactType.Inventory,
                    Content = "sealed-bytes",
                    ContentHash = "hash-kept"
                }
            ]
        };
        await repository.SaveAsync(saved, CancellationToken.None);

        ArtifactBundle? byId = await repository.GetByBundleIdInScopeAsync(
            scope, bundleId, loadArtifactBodies: true, CancellationToken.None);
        byId.Should().NotBeNull();
        byId!.ManifestId.Should().Be(executionManifestId);
        byId.Artifacts[0].Content.Should().Be("sealed-bytes");

        ArtifactBundle? descriptor = await repository.GetByBundleIdInScopeAsync(
            scope, bundleId, loadArtifactBodies: false, CancellationToken.None);
        descriptor.Should().NotBeNull();
        descriptor!.Artifacts[0].Content.Should().BeEmpty();
        descriptor.Artifacts[0].ContentHash.Should().Be("hash-kept");

        (await repository.GetByBundleIdInScopeAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId },
            bundleId, true, CancellationToken.None)).Should().BeNull();
        (await repository.GetByBundleIdInScopeAsync(
            new ScopeContext { TenantId = scope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = scope.ProjectId },
            bundleId, true, CancellationToken.None)).Should().BeNull();
        (await repository.GetByBundleIdInScopeAsync(
            new ScopeContext { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid() },
            bundleId, true, CancellationToken.None)).Should().BeNull();
    }
}
