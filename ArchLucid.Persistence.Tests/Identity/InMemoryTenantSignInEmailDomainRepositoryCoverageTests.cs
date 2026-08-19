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
}
