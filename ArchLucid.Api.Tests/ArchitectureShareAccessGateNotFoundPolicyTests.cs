using System.Net;
using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>AS-095: hidden restricted architectures and linked runs always surface as 404.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureShareAccessGateNotFoundPolicyTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly Guid RunId =
        Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<IArchitectureShareAccessService> _shareAccessService = new();
    private readonly Mock<IAuthenticatedPlatformUserResolver> _platformUserResolver = new();
    private readonly Mock<IRunRepository> _runRepository = new();

    [Fact]
    public async Task EnsureArchitectureReadAllowed_when_unshared_restricted_returns_404_not_403()
    {
        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                It.IsAny<Guid?>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                CanRead = false,
                CanDecide = false,
                CanAdmin = false,
            });

        ArchitectureShareAccessGate sut = BuildSut();
        ControllerBase controller = CreateController();

        IActionResult? result = await sut.EnsureArchitectureReadAllowedAsync(
            controller,
            new ClaimsPrincipal(),
            Scope,
            ArchitectureId,
            CancellationToken.None);

        AssertNotFound(result, HttpStatusCode.NotFound, ProblemTypes.ResourceNotFound);
    }

    [Fact]
    public async Task EnsureRunReadAllowed_when_unshared_restricted_returns_404_not_403()
    {
        _runRepository
            .Setup(repository => repository.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = RunId,
                ArchitectureId = ArchitectureId,
            });

        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                It.IsAny<Guid?>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                CanRead = false,
                CanDecide = false,
                CanAdmin = false,
            });

        ArchitectureShareAccessGate sut = BuildSut();
        ControllerBase controller = CreateController();

        IActionResult? result = await sut.EnsureRunReadAllowedAsync(
            controller,
            new ClaimsPrincipal(),
            Scope,
            RunId,
            CancellationToken.None);

        AssertNotFound(result, HttpStatusCode.NotFound, ProblemTypes.RunNotFound);
    }

    [Fact]
    public void ArchitectureNotFound_policy_helper_returns_404_with_resource_type()
    {
        ControllerBase controller = CreateController();

        IActionResult result = ArchitectureShareNotVisibleAsNotFoundResponsePolicy.ArchitectureNotFound(
            controller,
            ArchitectureId);

        AssertNotFound(result, HttpStatusCode.NotFound, ProblemTypes.ResourceNotFound);
    }

    [Fact]
    public void RunNotFound_policy_helper_returns_404_with_run_type()
    {
        ControllerBase controller = CreateController();

        IActionResult result = ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, RunId);

        AssertNotFound(result, HttpStatusCode.NotFound, ProblemTypes.RunNotFound);
    }

    private ArchitectureShareAccessGate BuildSut() =>
        new(_shareAccessService.Object, _platformUserResolver.Object, _runRepository.Object);

    private static ControllerBase CreateController() =>
        new TestController
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private static void AssertNotFound(
        IActionResult? result,
        HttpStatusCode expectedStatus,
        string expectedProblemType)
    {
        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be((int)expectedStatus);
        notFound.StatusCode.Should().NotBe((int)HttpStatusCode.Forbidden);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(expectedProblemType);
        problem.Status.Should().Be((int)expectedStatus);
    }

    private sealed class TestController : ControllerBase;
}
