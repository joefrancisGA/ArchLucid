using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Models.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Marketing;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MarketingPricingQuoteFollowUpAdminControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AcknowledgeAsync_returns_bad_request_when_assigned_owner_exceeds_max_length()
    {
        Mock<IMarketingPricingQuoteRequestFollowUpRepository> repository = new(MockBehavior.Strict);

        MarketingPricingQuoteFollowUpAdminController controller = CreateController(repository.Object);

        MarketingPricingQuoteAcknowledgeRequest request = new()
        {
            AssignedOwner = new string('o', 201),
        };

        IActionResult action = await controller.AcknowledgeAsync(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task AcknowledgeAsync_returns_bad_request_when_assigned_owner_contains_invalid_surrogate()
    {
        Mock<IMarketingPricingQuoteRequestFollowUpRepository> repository = new(MockBehavior.Strict);

        MarketingPricingQuoteFollowUpAdminController controller = CreateController(repository.Object);

        MarketingPricingQuoteAcknowledgeRequest request = new()
        {
            AssignedOwner = "\uD800",
        };

        IActionResult action = await controller.AcknowledgeAsync(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        repository.VerifyNoOtherCalls();
    }

    private static MarketingPricingQuoteFollowUpAdminController CreateController(
        IMarketingPricingQuoteRequestFollowUpRepository repository)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-1");

        return new MarketingPricingQuoteFollowUpAdminController(
            repository,
            scopeProvider.Object,
            actorContext.Object,
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(
                        new System.Security.Claims.ClaimsIdentity("test")),
                },
            },
        };
    }
}
