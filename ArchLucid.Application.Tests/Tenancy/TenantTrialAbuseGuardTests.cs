using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Identity;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantTrialAbuseGuardTests
{
    [Fact]
    public async Task ValidateIdentityLinkAsync_rejects_entra_oid_longer_than_sql_column()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        const string normalizedEmail = "ADMIN@CUSTOMER.COM";

        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TrialIdentityUserRecord
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    Email = "admin@customer.com",
                });

        Mock<ISelfServiceTrialAbuseRepository> abuseRepository = new();
        abuseRepository
            .Setup(r => r.HasEmailClaimForTenantAsync(normalizedEmail, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TenantTrialAbuseGuard sut = new(trialUsers.Object, abuseRepository.Object);

        TenantTrialIdentityLinkPrecheckResult result = await sut.ValidateIdentityLinkAsync(
            new TenantTrialLinkEntraBody
            {
                LocalEmail = "admin@customer.com",
                EntraOid = new string('o', TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength + 1),
            },
            tenantId,
            CancellationToken.None);

        result.Failure.Should().NotBeNull();
        result.Failure!.Outcome.Should().Be(TenantTrialHttpOutcome.ValidationFailed);
        result.Failure.Message.Should().Contain(TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength.ToString());
    }
}
