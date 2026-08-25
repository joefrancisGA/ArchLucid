using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RegistrationApplicationServiceTests
{
    [Fact]
    public async Task RegisterAsync_null_body_emits_TrialRegistrationFailed()
    {
        Mock<IAuditService> audit = new();
        Mock<ITenantProvisioningService> prov = new();
        RegistrationApplicationService sut = CreateSut(prov.Object, audit.Object);

        RegistrationResult result = await sut.RegisterAsync(null, CancellationToken.None);

        result.Outcome.Should().Be(RegistrationOutcome.BodyRequired);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialRegistrationFailed
                                       && e.ActorUserId == "anonymous@request"
                                       && e.DataJson.Contains("body_required", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
        prov.Verify(
            p => p.ProvisionAsync(It.IsAny<TenantProvisioningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_duplicate_org_emits_conflict()
    {
        Mock<IAuditService> audit = new();
        Mock<ITenantProvisioningService> prov = new();
        _ = prov
            .Setup(p => p.ProvisionAsync(It.IsAny<TenantProvisioningRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantProvisioningResult
                {
                    TenantId = Guid.NewGuid(),
                    DefaultWorkspaceId = Guid.NewGuid(),
                    DefaultProjectId = Guid.NewGuid(),
                    WasAlreadyProvisioned = true
                });
        RegistrationApplicationService sut = CreateSut(prov.Object, audit.Object);

        RegistrationResult result = await sut.RegisterAsync(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Dup " + Guid.NewGuid().ToString("N"),
                AdminEmail = "a@b.com",
                AdminDisplayName = "A"
            },
            CancellationToken.None);

        result.Outcome.Should().Be(RegistrationOutcome.Conflict);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialRegistrationFailed
                                       && e.DataJson.Contains("duplicate_slug", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_invite_only_does_not_audit_or_provision()
    {
        Mock<IAuditService> audit = new();
        Mock<ITenantProvisioningService> prov = new();
        RegistrationApplicationService sut = CreateSut(
            prov.Object,
            audit.Object,
            new PublicSignupOptions { Mode = PublicSignupMode.InviteOnly });

        RegistrationResult result = await sut.RegisterAsync(
            new TenantSelfRegistrationRequest { OrganizationName = "Org", AdminEmail = "a@b.com" },
            CancellationToken.None);

        result.Outcome.Should().Be(RegistrationOutcome.InviteOnly);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
        prov.Verify(
            p => p.ProvisionAsync(It.IsAny<TenantProvisioningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RegistrationApplicationService CreateSut(
        ITenantProvisioningService provisioning,
        IAuditService audit,
        PublicSignupOptions? publicSignup = null)
    {
        Mock<ISelfServiceTrialAbusePolicy> abusePolicy = new();
        abusePolicy
            .Setup(policy => policy.EvaluateAsync(
                It.IsAny<SelfServiceTrialAbuseEvaluationRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(SelfServiceTrialAbuseEvaluation.Allow());
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetBySlugFromControlPlaneCatalogAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        tenants
            .Setup(repository => repository.GetByNormalizedOrganizationNameAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        tenants
            .Setup(repository => repository.GetBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        return new RegistrationApplicationService(
            provisioning,
            tenants.Object,
            audit,
            Mock.Of<ITrialTenantBootstrapService>(),
            abusePolicy.Object,
            Options.Create(publicSignup ?? new PublicSignupOptions { Mode = PublicSignupMode.PublicSelfService }),
            TimeProvider.System);
    }
}
