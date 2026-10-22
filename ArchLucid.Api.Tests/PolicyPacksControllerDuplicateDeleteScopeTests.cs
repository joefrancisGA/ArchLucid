using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for policy pack duplicate and delete mutations (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerDuplicateDeleteScopeTests
{
    [Fact]
    public async Task DuplicatePack_returns_not_found_when_pack_belongs_to_another_workspace()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.DuplicatePackAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPack> { Outcome = PolicyPackHttpOutcome.ResourceNotFound });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.DuplicatePack(foreignPackId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DeletePack_returns_not_found_when_pack_belongs_to_another_workspace()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SoftDeletePackAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.DeletePack(foreignPackId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
