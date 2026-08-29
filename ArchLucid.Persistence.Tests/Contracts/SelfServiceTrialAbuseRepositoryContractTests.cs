using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
/// <summary>
///     Shared contract assertions for <see cref="ISelfServiceTrialAbuseRepository" />.
/// </summary>
public abstract class SelfServiceTrialAbuseRepositoryContractTests
{
    protected abstract ISelfServiceTrialAbuseRepository CreateRepository();

    /// <summary>No-op for in-memory implementations; Dapper + SQL Server subclasses skip when no instance is available.</summary>
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    [SkippableFact]
    public async Task HasEmailClaimForTenantAsync_matches_tenant_id_on_stored_claim()
    {
        SkipIfSqlServerUnavailable();
        ISelfServiceTrialAbuseRepository repository = CreateRepository();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid otherTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        await repository.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = "USER@EXAMPLE.COM",
                TenantId = tenantId,
                ClaimSource = "trial",
                ClaimedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        (await repository.HasEmailClaimForTenantAsync("USER@EXAMPLE.COM", tenantId, CancellationToken.None))
            .Should()
            .BeTrue();
        (await repository.HasEmailClaimForTenantAsync("USER@EXAMPLE.COM", otherTenantId, CancellationToken.None))
            .Should()
            .BeFalse();
    }
}
