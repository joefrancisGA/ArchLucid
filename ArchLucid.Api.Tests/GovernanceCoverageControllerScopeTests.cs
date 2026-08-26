using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceCoverageControllerScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetScopeCoverage_excludes_pack_metadata_when_pack_is_out_of_scope()
    {
        Guid inScopePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        CoverageSummary summary = new()
        {
            Assignments =
            [
                new CoverageAssignment
                {
                    PolicyPackId = inScopePackId,
                    PolicyPackVersion = "1.0.0",
                },
                new CoverageAssignment
                {
                    PolicyPackId = foreignPackId,
                    PolicyPackVersion = "1.0.0",
                },
            ],
        };

        Mock<ICoverageQueryService> coverage = new();
        coverage
            .Setup(s => s.GetByScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(ids => ids.Contains(foreignPackId) && ids.Contains(inScopePackId)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = inScopePackId,
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    Name = "in-scope-pack",
                    QualityDimension = QualityDimension.Security,
                },
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Scope.TenantId,
                    WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    Name = "foreign-pack-secret",
                    QualityDimension = QualityDimension.CostEffectiveness,
                },
            ]);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        GovernanceCoverageController controller = new(
            coverage.Object,
            Mock.Of<ICoveragePreviewService>(),
            packs.Object,
            scopeProvider.Object);

        IActionResult action = await controller.GetScopeCoverage(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        CoverageSummaryResponse body = ok.Value.Should().BeOfType<CoverageSummaryResponse>().Subject;
        body.Assignments.Should().HaveCount(2);

        CoverageAssignmentResponse inScopeAssignment = body.Assignments!
            .Single(assignment => assignment.PolicyPackId == inScopePackId.ToString("D"));
        inScopeAssignment.QualityDimension.Should().Be(QualityDimension.Security);

        CoverageAssignmentResponse foreignAssignment = body.Assignments
            .Single(assignment => assignment.PolicyPackId == foreignPackId.ToString("D"));
        foreignAssignment.QualityDimension.Should().BeNull();
    }
}
