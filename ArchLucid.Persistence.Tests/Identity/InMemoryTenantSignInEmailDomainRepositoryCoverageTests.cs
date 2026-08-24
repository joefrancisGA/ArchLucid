using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantSignInEmailDomainRepositoryCoverageTests
{
    [Fact]
    public async Task Seed_insert_list_tryget_update_and_duplicate_rejection()
    {
        InMemoryTenantSignInEmailDomainRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        TenantSignInEmailDomainRecord seeded = new()
        {
            TenantId = tenantA,
            NormalizedDomain = "seeded.example",
            CreatedUtc = now,
        };
        sut.Seed(seeded);

        await sut.InsertAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantA,
                NormalizedDomain = "alpha.example",
                CreatedUtc = now,
            },
            CancellationToken.None);
        await sut.InsertAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantA,
                NormalizedDomain = "beta.example",
                CreatedUtc = now,
            },
            CancellationToken.None);

        (await sut.FindByNormalizedDomainAsync("seeded.example", CancellationToken.None))!.TenantId
            .Should()
            .Be(tenantA);
        (await sut.ListByTenantIdAsync(tenantA, CancellationToken.None))
            .Select(r => r.NormalizedDomain)
            .Should()
            .Equal("alpha.example", "beta.example", "seeded.example");

        (await sut.TryGetAsync(tenantA, "alpha.example", CancellationToken.None)).Should().NotBeNull();
        (await sut.TryGetAsync(tenantB, "alpha.example", CancellationToken.None)).Should().BeNull();
        (await sut.TryGetAsync(tenantA, "missing.example", CancellationToken.None)).Should().BeNull();

        await sut.UpdateAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantA,
                NormalizedDomain = "alpha.example",
                CreatedUtc = now.AddMinutes(1),
            },
            CancellationToken.None);

        (await sut.FindByNormalizedDomainAsync("alpha.example", CancellationToken.None))!.CreatedUtc
            .Should()
            .Be(now.AddMinutes(1));

        Func<Task> duplicate = () => sut.InsertAsync(seeded, CancellationToken.None);
        await duplicate.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task FindByNormalizedDomainAsync_ListByTenantIdAsync_and_TryGetAsync_exclude_soft_removed_domains()
    {
        InMemoryTenantSignInEmailDomainRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        TenantSignInEmailDomainRecord active = new()
        {
            TenantId = tenantId,
            NormalizedDomain = "active.example",
            CreatedUtc = now,
        };
        TenantSignInEmailDomainRecord removed = new()
        {
            TenantId = tenantId,
            NormalizedDomain = "removed.example",
            CreatedUtc = now,
            RemovedUtc = now,
        };

        sut.Seed(active);
        sut.Seed(removed);

        (await sut.FindByNormalizedDomainAsync("removed.example", CancellationToken.None)).Should().BeNull();
        (await sut.TryGetAsync(tenantId, "removed.example", CancellationToken.None)).Should().BeNull();

        (await sut.ListByTenantIdAsync(tenantId, CancellationToken.None))
            .Select(row => row.NormalizedDomain)
            .Should()
            .Equal("active.example");
    }

    [Fact]
    public async Task UpdateAsync_does_not_reassign_domain_to_different_tenant()
    {
        InMemoryTenantSignInEmailDomainRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        await sut.InsertAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantA,
                NormalizedDomain = "corp.example",
                CreatedUtc = now,
            },
            CancellationToken.None);

        await sut.UpdateAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantB,
                NormalizedDomain = "corp.example",
                CreatedUtc = now.AddMinutes(5),
            },
            CancellationToken.None);

        (await sut.TryGetAsync(tenantA, "corp.example", CancellationToken.None)).Should().NotBeNull();
        (await sut.TryGetAsync(tenantB, "corp.example", CancellationToken.None)).Should().BeNull();
        (await sut.FindByNormalizedDomainAsync("corp.example", CancellationToken.None))!.TenantId.Should().Be(tenantA);
        (await sut.FindByNormalizedDomainAsync("corp.example", CancellationToken.None))!.CreatedUtc.Should().Be(now);
    }
}
