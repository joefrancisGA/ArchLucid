using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantSignInEmailDomainRecoveryAdminRepositoryCoverageTests
{
    [Fact]
    public async Task Insert_list_verify_lookup_and_delete_round_trip()
    {
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        await sut.InsertAsync(
            new TenantSignInEmailDomainRecoveryAdminRecord
            {
                TenantId = tenantId,
                NormalizedDomain = "example.com",
                NormalizedRecoveryAdminEmail = "admin@example.com",
                DisplayRecoveryAdminEmail = "Admin@Example.com",
                CreatedUtc = now,
                CreatedByActorId = "ops",
            },
            CancellationToken.None);

        await sut.InsertAsync(
            new TenantSignInEmailDomainRecoveryAdminRecord
            {
                TenantId = tenantId,
                NormalizedDomain = "example.com",
                NormalizedRecoveryAdminEmail = "backup@example.com",
                DisplayRecoveryAdminEmail = "Backup@Example.com",
                CreatedUtc = now,
                CreatedByActorId = "ops",
            },
            CancellationToken.None);

        (await sut.ListByDomainAsync(tenantId, "example.com", CancellationToken.None))
            .Select(r => r.NormalizedRecoveryAdminEmail)
            .Should()
            .Equal("admin@example.com", "backup@example.com");

        (await sut.IsRecoveryAdminAsync(tenantId, "example.com", "admin@example.com", CancellationToken.None))
            .Should()
            .BeFalse();

        await sut.MarkAuthenticationVerifiedAsync(
            tenantId,
            "example.com",
            "admin@example.com",
            now.AddMinutes(5),
            CancellationToken.None);
        await sut.MarkAuthenticationVerifiedAsync(
            tenantId,
            "example.com",
            "missing@example.com",
            now,
            CancellationToken.None);

        (await sut.IsRecoveryAdminAsync(tenantId, "example.com", "admin@example.com", CancellationToken.None))
            .Should()
            .BeTrue();
        (await sut.IsRecoveryAdminAsync(tenantId, "example.com", "missing@example.com", CancellationToken.None))
            .Should()
            .BeFalse();

        await sut.DeleteAsync(tenantId, "example.com", "backup@example.com", CancellationToken.None);
        (await sut.ListByDomainAsync(tenantId, "example.com", CancellationToken.None))
            .Should()
            .ContainSingle(r => r.NormalizedRecoveryAdminEmail == "admin@example.com");
    }
}
