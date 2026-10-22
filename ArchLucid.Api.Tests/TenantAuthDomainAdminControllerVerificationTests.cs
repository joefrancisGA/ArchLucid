using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantAuthDomainAdminControllerVerificationTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task StartVerificationAsync_returns_bad_request_when_domain_not_registered_for_tenant()
    {
        TenantAuthDomainAdminController controller = CreateController(new InMemoryTenantSignInEmailDomainRepository());

        IActionResult action = await controller.StartVerificationAsync(
            "missing.example",
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CheckVerificationAsync_returns_bad_request_when_domain_not_registered_for_tenant()
    {
        TenantAuthDomainAdminController controller = CreateController(new InMemoryTenantSignInEmailDomainRepository());

        IActionResult action = await controller.CheckVerificationAsync(
            "missing.example",
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RemoveDomainAsync_returns_bad_request_when_domain_not_registered_for_tenant()
    {
        TenantAuthDomainAdminController controller = CreateController(new InMemoryTenantSignInEmailDomainRepository());

        IActionResult action = await controller.RemoveDomainAsync(
            "missing.example",
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RemoveRecoveryAdminAsync_returns_bad_request_when_domain_not_registered_for_tenant()
    {
        TenantAuthDomainAdminController controller = CreateController(new InMemoryTenantSignInEmailDomainRepository());

        IActionResult action = await controller.RemoveRecoveryAdminAsync(
            "missing.example",
            "admin@missing.example",
            confirmRemoveLast: true,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    private static TenantAuthDomainAdminController CreateController(
        InMemoryTenantSignInEmailDomainRepository domains)
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();
        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs = new();

        TenantAuthDomainVerificationService verification = new(
            domains,
            recoveryAdmins,
            new AuthDomainDnsVerificationService(new NoOpDnsTxtRecordLookup(), clock),
            Mock.Of<IAuthSignInRoutingService>(),
            clock);

        TenantAuthDomainEnforcementService enforcement = new(
            domains,
            recoveryAdmins,
            idpConfigs,
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            clock);

        TenantAuthDomainRecoveryAdminService recovery = new(domains, recoveryAdmins, clock);

        TenantAuthDomainAdminService adminService = new(
            domains,
            clock,
            verification,
            enforcement,
            recovery);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("admin@test");

        return new TenantAuthDomainAdminController(
            adminService,
            Mock.Of<IAuthSignInRoutingService>(),
            scopeProvider.Object,
            actorContext.Object,
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    private sealed class NoOpDnsTxtRecordLookup : IDnsTxtRecordLookup
    {
        public Task<IReadOnlyList<string>> GetTxtRecordsAsync(string domain, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<string>>([]);
    }
}
