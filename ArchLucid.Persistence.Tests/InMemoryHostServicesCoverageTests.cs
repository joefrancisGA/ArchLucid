using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.AzureExtractorChunkUpload;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class InMemoryHostServicesCoverageTests
{
    [Fact]
    public async Task NoOpAdminNotificationsRepository_completes_insert()
    {
        NoOpAdminNotificationsRepository sut = new();

        await sut.Invoking(s => s.InsertAsync("kind", "summary", "{}", CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpImportedArchitectureRequestRepository_completes_insert()
    {
        NoOpImportedArchitectureRequestRepository sut = new();
        ImportedArchitectureRequestRecord record = new()
        {
            ImportId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SourceFileName = "request.json",
            Format = "json",
            CreatedUtc = DateTime.UtcNow,
        };

        await sut.Invoking(s => s.InsertAsync(record, CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task InMemoryProjectRoleAssignmentRepository_returns_none()
    {
        InMemoryProjectRoleAssignmentRepository sut = new();

        ProjectScopedEffectiveRole role = await sut.GetHighestRoleAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        role.Should().Be(ProjectScopedEffectiveRole.None);
    }

    [Fact]
    public async Task NoOpHostLeaderLeaseRepository_acquires_and_lists_empty()
    {
        NoOpHostLeaderLeaseRepository sut = new();

        (await sut.TryAcquireOrRenewAsync("lease", "instance", 30, CancellationToken.None)).Should().BeTrue();
        (await sut.ListAllAsync(CancellationToken.None)).Should().BeEmpty();
        await sut.Invoking(s => s.TryReleaseAsync("lease", "instance", CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public void UnusedSystemSqlConnectionFactory_reports_unavailable()
    {
        UnusedSystemSqlConnectionFactory sut = new();

        sut.SystemConnectionString.Should().BeEmpty();

        Func<Task> act = () => sut.CreateOpenConnectionAsync(CancellationToken.None);

        act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void UnusedTenantSqlConnectionFactory_reports_unavailable()
    {
        UnusedTenantSqlConnectionFactory sut = new();

        Func<Task> act = () => sut.CreateOpenConnectionAsync(CancellationToken.None);

        act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task NullAzureExtractorChunkSessionStore_is_not_available()
    {
        NullAzureExtractorChunkSessionStore sut = new();

        sut.IsAvailable.Should().BeFalse();
        await sut.Invoking(s => s.DeleteSessionAsync(Guid.NewGuid(), CancellationToken.None)).Should().NotThrowAsync();

        Func<Task> create = () => sut.CreateSessionAsync(
            new AzureExtractorChunkSessionDescriptor(new ScopeContext(), "a.zip", 1, 1),
            CancellationToken.None);

        await create.Should().ThrowAsync<InvalidOperationException>();
    }
}
