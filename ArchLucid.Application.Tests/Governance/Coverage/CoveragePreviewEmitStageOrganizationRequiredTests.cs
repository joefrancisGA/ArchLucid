using ArchLucid.Application.Governance.Coverage.Stages;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Category", "Unit")]
public sealed class CoveragePreviewEmitStageOrganizationRequiredTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void Emit_lists_org_required_assignment_when_IsOrganizationRequired_is_true()
    {
        Guid packId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        PolicyPack pack = new()
        {
            PolicyPackId = packId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            Name = "SOC 2 Type II (Architecture Themes)",
            CurrentVersion = "1.0.0",
        };

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = true,
            ScopeLevel = "Project",
            IsOrganizationRequired = true,
            IsPinned = false,
        };

        CoveragePreviewLoadResult load = new()
        {
            Packs = [pack],
            Assignments = [assignment],
            PackByName = new Dictionary<string, PolicyPack> { [pack.Name] = pack },
            AssignmentByPackId = new Dictionary<Guid, PolicyPackAssignment> { [packId] = assignment },
        };

        CoveragePreviewInput input = new()
        {
            CloudProvider = CloudProvider.Azure,
            FocusedPilotModeEnabled = true,
        };

        CoveragePreviewResult result = new CoveragePreviewEmitStage().Emit(Scope, input, load);

        result.Assignments.Should().ContainSingle(row =>
            row.CoverageType == CoverageType.OrganizationRequired
            && row.PolicyPackDisplayName == pack.Name);
    }
}
