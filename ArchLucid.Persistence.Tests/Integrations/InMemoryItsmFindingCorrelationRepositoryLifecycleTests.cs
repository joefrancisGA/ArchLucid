using ArchLucid.Persistence.Integrations;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Integrations;

/// <summary>In-memory ITSM correlation update/remove lifecycle (TB-388).</summary>
[Trait("Category", "Unit")]
public sealed class InMemoryItsmFindingCorrelationRepositoryLifecycleTests
{
    private static readonly Guid TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [SkippableFact]
    public async Task UpdateExternalTrackingAsync_changes_external_key_and_detects_conflict()
    {
        InMemoryItsmFindingCorrelationRepository sut = new();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-a",
            "Jira",
            "PROJ-1",
            "sys-1",
            null,
            CancellationToken.None);

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-b",
            "Jira",
            "PROJ-OTHER",
            null,
            null,
            CancellationToken.None);

        ItsmFindingCorrelationUpdateResult updated = await sut.UpdateExternalTrackingAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-a",
            "Jira",
            "PROJ-2",
            "sys-2",
            CancellationToken.None);

        updated.Status.Should().Be(ItsmFindingCorrelationUpdateStatus.Updated);
        updated.Prior!.ExternalKey.Should().Be("PROJ-1");
        updated.Current!.ExternalKey.Should().Be("PROJ-2");

        ItsmFindingCorrelationUpdateResult conflict = await sut.UpdateExternalTrackingAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-a",
            "Jira",
            "PROJ-OTHER",
            null,
            CancellationToken.None);

        conflict.Status.Should().Be(ItsmFindingCorrelationUpdateStatus.ExternalKeyConflict);
    }

    [SkippableFact]
    public async Task RemoveByFindingAndProviderAsync_returns_removed_row_and_is_idempotent()
    {
        InMemoryItsmFindingCorrelationRepository sut = new();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-a",
            "ServiceNow",
            "INC001",
            null,
            null,
            CancellationToken.None);

        ItsmFindingCorrelationRecord? removed = await sut.RemoveByFindingAndProviderAsync(
            TenantId,
            "finding-a",
            "ServiceNow",
            CancellationToken.None);

        removed.Should().NotBeNull();
        removed!.ExternalKey.Should().Be("INC001");

        ItsmFindingCorrelationRecord? secondRemove = await sut.RemoveByFindingAndProviderAsync(
            TenantId,
            "finding-a",
            "ServiceNow",
            CancellationToken.None);

        secondRemove.Should().BeNull();
    }
}
