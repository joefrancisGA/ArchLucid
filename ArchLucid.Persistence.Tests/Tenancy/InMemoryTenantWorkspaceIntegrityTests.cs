using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantWorkspaceIntegrityTests
{
    [Fact]
    public async Task Missing_tenant_rejects_workspace_insertion()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        Func<Task> insert = () => repository.InsertWorkspaceAsync(
            workspaceId, tenantId, "unowned", Guid.NewGuid(), CancellationToken.None);
        await insert.Should().ThrowAsync<InvalidOperationException>();

        (await repository.WorkspaceExistsAsync(
            tenantId, workspaceId, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task Duplicate_workspace_id_within_tenant_is_rejected_without_overwriting_first_row()
    {
        InMemoryTenantRepository repository = new();
        Guid tenant = await CreateTenantAsync(repository);
        Guid workspace = Guid.NewGuid();
        Guid firstProject = Guid.NewGuid();

        await repository.InsertWorkspaceAsync(
            workspace, tenant, "original", firstProject, CancellationToken.None);
        Func<Task> duplicate = () => repository.InsertWorkspaceAsync(
            workspace, tenant, "duplicate", Guid.NewGuid(), CancellationToken.None);
        await duplicate.Should().ThrowAsync<InvalidOperationException>();

        IReadOnlyList<TenantWorkspaceListItem> rows =
            await repository.ListWorkspacesAsync(tenant, CancellationToken.None);
        rows.Should().ContainSingle();
        rows[0].Name.Should().Be("original");
        rows[0].DefaultProjectId.Should().Be(firstProject);
    }

    [Fact]
    public async Task Workspace_primary_key_is_unique_across_tenants()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantA = await CreateTenantAsync(repository);
        Guid tenantB = await CreateTenantAsync(repository);
        Guid workspace = Guid.NewGuid();

        await repository.InsertWorkspaceAsync(
            workspace, tenantA, "A", Guid.NewGuid(), CancellationToken.None);
        Func<Task> crossTenantInsert = () => repository.InsertWorkspaceAsync(
            workspace, tenantB, "B", Guid.NewGuid(), CancellationToken.None);
        await crossTenantInsert.Should().ThrowAsync<InvalidOperationException>();

        (await repository.WorkspaceExistsAsync(tenantA, workspace, CancellationToken.None))
            .Should().BeTrue();
        (await repository.WorkspaceExistsAsync(tenantB, workspace, CancellationToken.None))
            .Should().BeFalse();
    }

    [Fact]
    public async Task Concurrent_cross_tenant_inserts_admit_one_workspace_id()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantA = await CreateTenantAsync(repository);
        Guid tenantB = await CreateTenantAsync(repository);
        Guid workspace = Guid.NewGuid();

        Task<bool>[] attempts = Enumerable.Range(0, 32).Select(i => Task.Run(async () =>
        {
            try
            {
                await repository.InsertWorkspaceAsync(
                    workspace, i % 2 == 0 ? tenantA : tenantB,
                    $"candidate-{i}", Guid.NewGuid(), CancellationToken.None);
                return true;
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        })).ToArray();

        bool[] results = await Task.WhenAll(attempts);
        results.Count(success => success).Should().Be(1);
        IReadOnlyList<TenantWorkspaceListItem> a =
            await repository.ListWorkspacesAsync(tenantA, CancellationToken.None);
        IReadOnlyList<TenantWorkspaceListItem> b =
            await repository.ListWorkspacesAsync(tenantB, CancellationToken.None);
        (a.Count + b.Count).Should().Be(1);
    }

    [Fact]
    public async Task Canceled_workspace_insert_does_not_create_a_row()
    {
        InMemoryTenantRepository repository = new();
        Guid tenant = await CreateTenantAsync(repository);
        Guid workspace = Guid.NewGuid();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> insert = () => repository.InsertWorkspaceAsync(
            workspace, tenant, "canceled", Guid.NewGuid(), canceled.Token);
        await insert.Should().ThrowAsync<OperationCanceledException>();

        (await repository.WorkspaceExistsAsync(
            tenant, workspace, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task Canceled_workspace_reads_propagate_cancellation()
    {
        InMemoryTenantRepository repository = new();
        Guid tenant = await CreateTenantAsync(repository);
        Guid workspace = Guid.NewGuid();
        await repository.InsertWorkspaceAsync(
            workspace, tenant, "existing", Guid.NewGuid(), CancellationToken.None);
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task>[] queries =
        [
            () => repository.GetFirstWorkspaceAsync(tenant, canceled.Token),
            () => repository.WorkspaceExistsAsync(tenant, workspace, canceled.Token),
            () => repository.GetWorkspaceByIdAsync(tenant, workspace, canceled.Token),
            () => repository.ListWorkspacesAsync(tenant, canceled.Token),
        ];

        foreach (Func<Task> query in queries)
            await query.Should().ThrowAsync<OperationCanceledException>();

        (await repository.ListWorkspacesAsync(tenant, CancellationToken.None))
            .Should().ContainSingle();
    }

    private static async Task<Guid> CreateTenantAsync(InMemoryTenantRepository repository)
    {
        Guid tenant = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenant,
            "Workspace integrity test",
            "workspace-test-" + tenant.ToString("N")[..12],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        return tenant;
    }
}
