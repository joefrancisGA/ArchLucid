using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryPlatformTenantAuthRecoveryGrantRepositoryCoverageTests
{
    [Fact]
    public async Task Insert_active_lookup_revoke_and_notify_cover_branches()
    {
        InMemoryPlatformTenantAuthRecoveryGrantRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        PlatformTenantAuthRecoveryGrantRecord stored = await sut.InsertAsync(
            new PlatformTenantAuthRecoveryGrantRecord
            {
                TenantId = tenantId,
                NormalizedDomain = "example.com",
                Reason = "lost-idp",
                EvidenceReference = "ticket-1",
                GrantedByActorId = "ops",
                GrantedUtc = now.AddMinutes(-10),
                ExpiresUtc = now.AddHours(1),
            },
            CancellationToken.None);

        stored.GrantId.Should().NotBe(Guid.Empty);
        (await sut.GetByIdAsync(stored.GrantId, CancellationToken.None))!.NormalizedDomain.Should().Be("example.com");

        (await sut.GetActiveByTenantAndDomainAsync(tenantId, "example.com", now, CancellationToken.None))!.GrantId
            .Should()
            .Be(stored.GrantId);
        (await sut.GetActiveByTenantAndDomainAsync(tenantId, "other.com", now, CancellationToken.None))
            .Should()
            .BeNull();

        (await sut.RevokeAsync(Guid.NewGuid(), "ops", now, CancellationToken.None)).Should().BeFalse();
        (await sut.RevokeAsync(stored.GrantId, "ops", now, CancellationToken.None)).Should().BeTrue();
        (await sut.GetActiveByTenantAndDomainAsync(tenantId, "example.com", now, CancellationToken.None))
            .Should()
            .BeNull();

        await sut.MarkTenantNotifiedAsync(stored.GrantId, now.AddMinutes(1), CancellationToken.None);
        await sut.MarkTenantNotifiedAsync(Guid.NewGuid(), now, CancellationToken.None);

        (await sut.GetByIdAsync(stored.GrantId, CancellationToken.None))!.TenantNotifiedUtc
            .Should()
            .Be(now.AddMinutes(1));
    }
}
