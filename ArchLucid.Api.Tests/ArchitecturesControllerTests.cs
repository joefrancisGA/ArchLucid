using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _service = new();

    public ArchitecturesControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
    }

    [Fact]
    public async Task ListArchitectures_ReturnsPagedItems()
    {
        ArchitectureIdentityListPage page = new()
        {
            Items =
            [
                new ArchitectureIdentityListItem
                {
                    ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    DisplayName = "Vertex",
                },
            ],
            TotalCount = 1,
            Page = 1,
            PageSize = 50,
        };

        _service
            .Setup(s => s.ListIdentitiesAsync(Scope, 1, 50, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListArchitectures(cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(page);
    }

    [Fact]
    public async Task GetArchitecture_NotFound_Returns404()
    {
        Guid architectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        _service
            .Setup(s => s.GetIdentityAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureIdentityDetail?)null);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetArchitecture(architectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PatchArchitecture_EmptyDisplayName_Returns400()
    {
        Guid architectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        _service
            .Setup(s => s.PatchAsync(
                Scope,
                architectureId,
                It.IsAny<PatchArchitectureIdentityRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Display name cannot be empty."));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PatchArchitecture(
            architectureId,
            new PatchArchitectureIdentityRequest { DisplayName = "   " },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PatchArchitecture_NotFound_Returns404()
    {
        Guid architectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        _service
            .Setup(s => s.PatchAsync(
                Scope,
                architectureId,
                It.IsAny<PatchArchitectureIdentityRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureIdentityRecord?)null);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PatchArchitecture(
            architectureId,
            new PatchArchitectureIdentityRequest { DisplayName = "Renamed" },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void PatchArchitecture_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.PatchArchitecture))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucid.Core.Authorization.ArchLucidPolicies.ExecuteAuthority);
    }

    private ArchitecturesController BuildSut() =>
        new(_scopeProvider.Object, _actorContext.Object, _service.Object, _auditService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
