using System.Text.Json;

using ArchLucid.Application.Scim;
using ArchLucid.Application.Scim.RoleMapping;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Scim;

[Trait("Suite", "Core")]
public sealed class ScimUsersServiceUnitTests
{
    [Fact]
    public void ScimUserResourceParser_trimmed_external_id_collides_with_existing_trimmed_value()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """
            {
              "userName": "alice@example.com",
              "externalId": "  ext-1  "
            }
            """);

        (string _, string? _, bool _, string externalId) = ScimUserResourceParser.ParseUser(doc.RootElement);

        externalId.Should().Be("ext-1");
    }

    [Fact]
    public async Task CreateAsync_trimmed_external_id_conflicts_with_existing_user()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryScimUserRepository users = new();
        InMemoryTenantRepository tenants = new();
        ScimUserService sut = CreateService(users, tenants);

        await users.InsertAsync(
            tenantId,
            "ext-1",
            "alice@example.com",
            null,
            true,
            null,
            ScimResolvedRoleOrigin.Unknown,
            CancellationToken.None);

        using JsonDocument body = JsonDocument.Parse(
            """
            {
              "userName": "bob@example.com",
              "externalId": "  ext-1  ",
              "active": true
            }
            """);

        Func<Task> act = () => sut.CreateAsync(tenantId, body.RootElement, CancellationToken.None);

        await act.Should().ThrowAsync<ScimConflictException>();
    }

    [Fact]
    public async Task ReplaceAsync_duplicate_external_id_throws_conflict()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryScimUserRepository users = new();
        InMemoryTenantRepository tenants = new();
        ScimUserService sut = CreateService(users, tenants);

        ScimUserRecord first = await users.InsertAsync(
            tenantId,
            "ext-a",
            "alice@example.com",
            null,
            true,
            null,
            ScimResolvedRoleOrigin.Unknown,
            CancellationToken.None);

        ScimUserRecord second = await users.InsertAsync(
            tenantId,
            "ext-b",
            "bob@example.com",
            null,
            true,
            null,
            ScimResolvedRoleOrigin.Unknown,
            CancellationToken.None);

        using JsonDocument body = JsonDocument.Parse(
            """
            {
              "userName": "bob@example.com",
              "externalId": "ext-a",
              "active": true
            }
            """);

        Func<Task> act = () => sut.ReplaceAsync(tenantId, second.Id, body.RootElement, CancellationToken.None);

        await act.Should().ThrowAsync<ScimConflictException>();
        first.ExternalId.Should().Be("ext-a");
    }

    [Fact]
    public async Task CreateAsync_releases_reserved_seat_when_insert_fails()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IScimUserRepository> users = new();
        Mock<ITenantRepository> tenants = new();

        users
            .Setup(r => r.GetByExternalIdAsync(tenantId, "alice@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimUserRecord?)null);

        tenants
            .Setup(t => t.TryIncrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        tenants
            .Setup(t => t.DecrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        users
            .Setup(r => r.InsertAsync(
                tenantId,
                "alice@example.com",
                "alice@example.com",
                null,
                true,
                null,
                ScimResolvedRoleOrigin.Unknown,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated insert failure"));

        ScimUserService sut = CreateService(users, tenants);

        using JsonDocument body = JsonDocument.Parse(
            """
            {
              "userName": "alice@example.com",
              "active": true
            }
            """);

        Func<Task> act = () => sut.CreateAsync(tenantId, body.RootElement, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        tenants.Verify(
            t => t.DecrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReplaceAsync_compensates_seat_when_persistence_fails_after_activation()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryScimUserRepository users = new();
        Mock<ITenantRepository> tenants = new();
        ScimUserRecord existing = await users.InsertAsync(
            tenantId,
            "ext-1",
            "alice@example.com",
            null,
            false,
            null,
            ScimResolvedRoleOrigin.Unknown,
            CancellationToken.None);

        tenants
            .Setup(t => t.TryIncrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        tenants
            .Setup(t => t.DecrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScimUserRepository> usersMock = new();
        usersMock
            .Setup(r => r.GetByIdAsync(tenantId, existing.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        usersMock
            .Setup(r => r.GetByExternalIdAsync(tenantId, "ext-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        usersMock
            .Setup(r => r.ListGroupKeysForUserAsync(tenantId, existing.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<(string DisplayName, string ExternalId)>());

        usersMock
            .Setup(r => r.ReplaceAsync(
                tenantId,
                existing.Id,
                "ext-1",
                "alice@example.com",
                null,
                true,
                null,
                ScimResolvedRoleOrigin.Unknown,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated replace failure"));

        ScimUserService sut = CreateService(usersMock, tenants);

        using JsonDocument body = JsonDocument.Parse(
            """
            {
              "userName": "alice@example.com",
              "externalId": "ext-1",
              "active": true
            }
            """);

        Func<Task> act = () => sut.ReplaceAsync(tenantId, existing.Id, body.RootElement, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        tenants.Verify(
            t => t.DecrementEnterpriseScimSeatAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListAsync_normalizes_start_index_below_one()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryScimUserRepository users = new();
        InMemoryTenantRepository tenants = new();
        ScimUserService sut = CreateService(users, tenants);

        await users.InsertAsync(
            tenantId,
            "ext-1",
            "alice@example.com",
            null,
            true,
            null,
            ScimResolvedRoleOrigin.Unknown,
            CancellationToken.None);

        (IReadOnlyList<ScimUserRecord> items, int total) =
            await sut.ListAsync(tenantId, null, 0, 100, CancellationToken.None);

        total.Should().Be(1);
        items.Should().ContainSingle();
    }

    private static ScimUserService CreateService(IScimUserRepository users, ITenantRepository tenants)
    {
        return new ScimUserService(
            users,
            tenants,
            new GroupToRoleMapper(Options.Create(new ScimOptions())),
            Mock.Of<IAuditService>(),
            NullLogger<ScimUserService>.Instance);
    }

    private static ScimUserService CreateService(Mock<IScimUserRepository> users, Mock<ITenantRepository> tenants)
    {
        return new ScimUserService(
            users.Object,
            tenants.Object,
            new GroupToRoleMapper(Options.Create(new ScimOptions())),
            Mock.Of<IAuditService>(),
            NullLogger<ScimUserService>.Instance);
    }
}
