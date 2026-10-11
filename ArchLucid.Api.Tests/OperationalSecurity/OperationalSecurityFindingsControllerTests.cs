using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.OperationalSecurity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalSecurityFindingsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Lookup_returns_bad_request_when_request_is_null()
    {
        OperationalSecurityFindingsController controller = CreateController();

        IActionResult result = await controller.Lookup(null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lookup_returns_bad_request_when_source_system_is_missing()
    {
        OperationalSecurityFindingsController controller = CreateController();

        IActionResult result = await controller.Lookup(
            new OperationalSecurityFindingLookupRequest
            {
                SourceSystem = " ",
                SourceFindingIds = ["finding-1"],
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lookup_returns_bad_request_when_source_finding_ids_are_null()
    {
        OperationalSecurityFindingsController controller = CreateController();

        IActionResult result = await controller.Lookup(
            new OperationalSecurityFindingLookupRequest
            {
                SourceSystem = "DiagramReconciliation",
                SourceFindingIds = null!,
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lookup_returns_bad_request_when_source_finding_ids_are_empty()
    {
        OperationalSecurityFindingsController controller = CreateController();

        IActionResult result = await controller.Lookup(
            new OperationalSecurityFindingLookupRequest
            {
                SourceSystem = "DiagramReconciliation",
                SourceFindingIds = [" ", ""],
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lookup_returns_bad_request_when_more_than_200_source_finding_ids_are_supplied()
    {
        OperationalSecurityFindingsController controller = CreateController();
        List<string> sourceFindingIds = Enumerable.Range(1, 201)
            .Select(index => $"finding-{index}")
            .ToList();

        IActionResult result = await controller.Lookup(
            new OperationalSecurityFindingLookupRequest
            {
                SourceSystem = "DiagramReconciliation",
                SourceFindingIds = sourceFindingIds,
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lookup_returns_azure_natural_key_matches_and_skips_unknown_ids()
    {
        Guid findingId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Mock<IOperationalSecurityFindingRepository> repository = new();
        repository
            .Setup(service => service.TryGetByNaturalKeyInScopeAsync(
                It.Is<ProjectScopeKey>(key =>
                    key.TenantId == Scope.TenantId
                    && key.WorkspaceId == Scope.WorkspaceId
                    && key.ProjectId == Scope.ProjectId),
                CloudProvider.Azure,
                "DiagramReconciliation",
                "finding-1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OperationalSecurityFindingRecord
            {
                FindingId = findingId,
                SourceFindingId = "finding-1",
                Status = OperationalSecurityFindingStatus.Open,
            });

        OperationalSecurityFindingsController controller = CreateController(repository: repository.Object);

        IActionResult result = await controller.Lookup(
            new OperationalSecurityFindingLookupRequest
            {
                SourceSystem = " DiagramReconciliation ",
                SourceFindingIds = [" finding-1 ", "finding-missing", "finding-1"],
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<OperationalSecurityFindingLookupItem> matches = ok.Value
            .Should()
            .BeAssignableTo<IReadOnlyList<OperationalSecurityFindingLookupItem>>()
            .Subject;

        matches.Should().ContainSingle();
        matches[0].FindingId.Should().Be(findingId);
        matches[0].SourceFindingId.Should().Be("finding-1");
        matches[0].Status.Should().Be(nameof(OperationalSecurityFindingStatus.Open));

        repository.Verify(
            service => service.TryGetByNaturalKeyInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                CloudProvider.Azure,
                "DiagramReconciliation",
                "finding-1",
                It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            service => service.TryGetByNaturalKeyInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                CloudProvider.Azure,
                "DiagramReconciliation",
                "finding-missing",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static OperationalSecurityFindingsController CreateController(
        IOperationalSecurityFindingRepository? repository = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return new OperationalSecurityFindingsController(
            Mock.Of<IOperationalSecurityFindingIngestService>(),
            repository ?? Mock.Of<IOperationalSecurityFindingRepository>(),
            scopeProvider.Object,
            Mock.Of<IActorContext>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
