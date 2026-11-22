using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InMemoryArchitectureIdentityRepositorySnapshotTests
{
    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task Create_result_mutation_cannot_rewrite_stored_scope_or_share_visibility()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = NewScope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(scope, "Original", "model-a");
        Guid id = created.ArchitectureId;

        ScopeContext foreignScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };

        created.TenantId = foreignScope.TenantId;
        created.WorkspaceId = Guid.NewGuid();
        created.ScopeProjectId = Guid.NewGuid();
        created.RestrictToShares = true;
        created.ArchivedUtc = DateTime.UtcNow;
        created.DisplayName = "Overwritten externally";

        ArchitectureIdentityRecord stored = (await repository.GetByIdAsync(scope, id))!;
        stored.Should().NotBeNull();
        stored.Should().NotBeSameAs(created);
        stored.TenantId.Should().Be(scope.TenantId);
        stored.WorkspaceId.Should().Be(scope.WorkspaceId);
        stored.ScopeProjectId.Should().Be(scope.ProjectId);
        stored.DisplayName.Should().Be("Original");
        stored.RestrictToShares.Should().BeFalse();
        stored.ArchivedUtc.Should().BeNull();
        (await repository.CountArchivedInScopeAsync(scope)).Should().Be(0);

        (await repository.GetByIdAsync(foreignScope, id)).Should().BeNull();
        (await repository.TrySetRestrictToSharesAsync(scope, id, true)).Should().BeTrue();
        (await repository.GetByIdAsync(scope, id))!.RestrictToShares.Should().BeTrue();
    }

    [Fact]
    public async Task Read_result_mutation_cannot_change_stored_identity_but_explicit_updates_can()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = NewScope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(scope, "Original", "model-a");
        Guid id = created.ArchitectureId;
        Guid manifestId = Guid.NewGuid();

        await repository.UpdateCurrentModelAsync(scope, id, "model-b");
        await repository.UpdateLatestSealedManifestAsync(scope, id, manifestId);
        (await repository.TryPatchAsync(scope, id, true, "Renamed", true, "description")).Should().BeTrue();

        ArchitectureIdentityRecord read = (await repository.GetByIdAsync(scope, id))!;
        read.CurrentModelId.Should().Be("model-b");
        read.LatestSealedManifestId.Should().Be(manifestId);
        read.DisplayName.Should().Be("Renamed");
        read.Description.Should().Be("description");
        read.ArchitectureId = Guid.NewGuid();
        read.TenantId = Guid.NewGuid();
        read.DisplayName = "Externally overwritten";
        read.Description = "spoof";
        read.CurrentModelId = null;
        read.LatestSealedManifestId = null;
        read.RestrictToShares = true;

        ArchitectureIdentityRecord next = (await repository.GetByIdAsync(scope, id))!;
        next.Should().NotBeSameAs(read);
        next.ArchitectureId.Should().Be(id);
        next.TenantId.Should().Be(scope.TenantId);
        next.DisplayName.Should().Be("Renamed");
        next.Description.Should().Be("description");
        next.CurrentModelId.Should().Be("model-b");
        next.LatestSealedManifestId.Should().Be(manifestId);
        next.RestrictToShares.Should().BeFalse();
    }
}
