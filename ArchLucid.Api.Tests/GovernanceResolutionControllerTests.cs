using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tenant preflight for <c>GET /v1/governance-resolution</c> (ghost tenant must not return HTTP 200).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceResolutionControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Resolve_returns_not_found_when_tenant_missing()
    {
        Mock<IEffectiveGovernanceResolver> resolver = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernanceResolutionController controller = new(
            scopeProvider.Object,
            resolver.Object,
            tenants.Object,
            audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.Resolve(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        resolver.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Resolve_returns_resolution_when_tenant_exists()
    {
        EffectiveGovernanceResolutionResult expected = new()
        {
            EffectiveContent = new PolicyPackContentDocument(),
            Decisions = [],
            Conflicts = [],
            Notes = [],
        };

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        GovernanceResolutionController controller = new(
            scopeProvider.Object,
            resolver.Object,
            tenants.Object,
            audit.Object);

        IActionResult result = await controller.Resolve(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}
