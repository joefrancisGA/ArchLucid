using System.Net;
using System.Security.Claims;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
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
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IRunRepository> _runRepository = new();

    public ArchitectureShareAccessGateNotFoundPolicyTests()
    {
        _actorContext.Setup(static context => context.GetActorId()).Returns("jwt:tenant:unshared");
    }

    [Fact]
    public async Task EnsureArchitectureReadAllowed_when_unshared_restricted_returns_404_not_403()
    {
        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                It.IsAny<string?>(),
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
                It.IsAny<string?>(),
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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Ask_adapter_reuses_authenticated_share_decision(bool canRead)
    {
        _runRepository.Setup(r => r.GetByIdAsync(Scope, RunId, CancellationToken.None))
            .ReturnsAsync(new RunRecord { RunId = RunId, ArchitectureId = ArchitectureId });
        _shareAccessService.Setup(s => s.EvaluateAsync(Scope, ArchitectureId, "jwt:tenant:unshared",
                true, false, false, CancellationToken.None))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = canRead });

        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Role, "Reader")], "test")),
        };
        AskEvidenceAccess adapter = new(BuildSut(), new HttpContextAccessor { HttpContext = http }, _actorContext.Object);

        (await adapter.CanReadRunAsync(Scope, RunId, CancellationToken.None)).Should().Be(canRead);
        _shareAccessService.Verify(s => s.EvaluateAsync(Scope, ArchitectureId, "jwt:tenant:unshared",
            true, false, false, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Ask_adapter_without_authenticated_principal_denies_before_repository_lookup()
    {
        AskEvidenceAccess adapter = new(BuildSut(), new HttpContextAccessor(), _actorContext.Object);
        adapter.GetAuthorizedActorId().Should().BeNull();
        (await adapter.CanReadRunAsync(Scope, RunId, CancellationToken.None)).Should().BeFalse();
        _runRepository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("api-user")]
    [InlineData("API-USER")]
    [InlineData(" ")]
    public async Task Ask_adapter_denies_unidentified_actor_even_after_a_successful_read(string unidentifiedActor)
    {
        _runRepository.Setup(r => r.GetByIdAsync(Scope, RunId, CancellationToken.None))
            .ReturnsAsync(new RunRecord { RunId = RunId });
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Role, "Operator")], "test")),
        };
        AskEvidenceAccess adapter = new(BuildSut(), new HttpContextAccessor { HttpContext = http }, _actorContext.Object);

        adapter.GetAuthorizedActorId().Should().Be("jwt:tenant:unshared");
        (await adapter.CanReadRunAsync(Scope, RunId, CancellationToken.None)).Should().BeTrue();
        _runRepository.Invocations.Clear();

        _actorContext.Setup(c => c.GetActorId()).Returns(unidentifiedActor);

        adapter.GetAuthorizedActorId().Should().BeNull();
        adapter.GetAuthorizedDraftActorId().Should().BeNull();
        (await adapter.CanReadRunAsync(Scope, RunId, CancellationToken.None)).Should().BeFalse();
        (await adapter.CanDecideArchitectureAsync(Scope, ArchitectureId, CancellationToken.None)).Should().BeFalse();
        _runRepository.VerifyNoOtherCalls();
        _shareAccessService.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("Reader", true, true, false)]
    [InlineData("Operator", true, false, false)]
    [InlineData("Operator", false, true, false)]
    [InlineData("Operator", true, true, true)]
    public async Task Draft_adapter_requires_execute_and_both_existing_share_capabilities(
        string role, bool canRead, bool canDecide, bool expected)
    {
        _shareAccessService.Setup(s => s.EvaluateAsync(Scope, ArchitectureId, "jwt:tenant:unshared",
                true, true, false, CancellationToken.None))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true, CanRead = canRead, CanDecide = canDecide,
            });
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Role, role)], "test")),
        };
        AskEvidenceAccess adapter = new(BuildSut(), new HttpContextAccessor { HttpContext = http }, _actorContext.Object);

        (await adapter.CanDecideArchitectureAsync(Scope, ArchitectureId, CancellationToken.None)).Should().Be(expected);
        if (role == "Reader")
        {
            adapter.GetAuthorizedDraftActorId().Should().BeNull();
            _shareAccessService.VerifyNoOtherCalls();
        }
        else
        {
            adapter.GetAuthorizedDraftActorId().Should().Be("jwt:tenant:unshared");
            _shareAccessService.Verify(s => s.EvaluateAsync(Scope, ArchitectureId, "jwt:tenant:unshared",
                true, true, false, CancellationToken.None), Times.Once);
        }
    }

    private ArchitectureShareAccessGate BuildSut() =>
        new(_shareAccessService.Object, _actorContext.Object, _runRepository.Object);

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
    }

    private sealed class TestController : ControllerBase;
}
