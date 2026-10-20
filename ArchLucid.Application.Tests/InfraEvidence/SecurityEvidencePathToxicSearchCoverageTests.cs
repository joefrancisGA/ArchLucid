using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathToxicSearchCoverageTests
{
    private static readonly Guid TenantId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid WorkspaceId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid ProjectId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
    private static readonly Guid SnapshotId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");

    [Fact]
    public async Task ReplaceFromParentEnginesAsync_writes_toxic_row_from_privilege_parent_cap()
    {
        ScopeContext scope = CreateScope();
        InMemorySecurityEvidencePathSearchCoverageRepository repository = new();

        await SecurityEvidencePathSearchCoverageRecorder.ReplaceAsync(
            repository,
            scope,
            SnapshotId,
            SecurityEvidencePathSearchEngineNames.Privilege,
            [
                new SecurityEvidencePathSearchLimitHit
                {
                    Kind = SecurityEvidencePathSearchLimitKind.MaxPaths,
                    LimitValue = 20,
                    PathsEmitted = 20,
                },
            ],
            CancellationToken.None);

        await SecurityEvidencePathToxicSearchCoverageRecorder.ReplaceFromParentEnginesAsync(
            repository,
            scope,
            SnapshotId,
            toxicPathsEmitted: 3,
            CancellationToken.None);

        SecurityEvidencePathSearchCoverageRecord toxicRow = repository.AllRows
            .Single(row => row.EngineName == SecurityEvidencePathSearchEngineNames.ToxicCombination);

        toxicRow.LimitKind.Should().Be(SecurityEvidencePathSearchLimitKind.MaxPaths);
        toxicRow.LimitValue.Should().Be(20);
        toxicRow.PathsEmitted.Should().Be(3);
    }

    [Fact]
    public async Task ReplaceFromParentEnginesAsync_uses_smaller_parent_limit_when_both_hit_max_paths()
    {
        ScopeContext scope = CreateScope();
        InMemorySecurityEvidencePathSearchCoverageRepository repository = new();

        await SecurityEvidencePathSearchCoverageRecorder.ReplaceAsync(
            repository,
            scope,
            SnapshotId,
            SecurityEvidencePathSearchEngineNames.Privilege,
            [
                new SecurityEvidencePathSearchLimitHit
                {
                    Kind = SecurityEvidencePathSearchLimitKind.MaxPaths,
                    LimitValue = 100,
                    PathsEmitted = 100,
                },
            ],
            CancellationToken.None);

        await SecurityEvidencePathSearchCoverageRecorder.ReplaceAsync(
            repository,
            scope,
            SnapshotId,
            SecurityEvidencePathSearchEngineNames.IntendedReachability,
            [
                new SecurityEvidencePathSearchLimitHit
                {
                    Kind = SecurityEvidencePathSearchLimitKind.MaxPaths,
                    LimitValue = 20,
                    PathsEmitted = 20,
                },
            ],
            CancellationToken.None);

        await SecurityEvidencePathToxicSearchCoverageRecorder.ReplaceFromParentEnginesAsync(
            repository,
            scope,
            SnapshotId,
            toxicPathsEmitted: 1,
            CancellationToken.None);

        SecurityEvidencePathSearchCoverageRecord toxicRow = repository.AllRows
            .Single(row => row.EngineName == SecurityEvidencePathSearchEngineNames.ToxicCombination);

        toxicRow.LimitValue.Should().Be(20);
    }

    [Fact]
    public void Assembler_uses_toxic_why_text_for_toxic_combination_engine()
    {
        SecurityEvidencePathSearchCoverageRecord coverage = new()
        {
            SearchCoverageId = Guid.NewGuid(),
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            EngineName = SecurityEvidencePathSearchEngineNames.ToxicCombination,
            LimitKind = SecurityEvidencePathSearchLimitKind.MaxPaths,
            LimitValue = 20,
            PathsEmitted = 2,
            CreatedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathReportResponse report = SecurityEvidencePathReportAssembler.Assemble(
            SnapshotId,
            [],
            [],
            [],
            [coverage]);

        SecurityEvidencePathReportUnevaluatedGroupResponse group = report.UnevaluatedGroups
            .Single(group => group.EngineName == "Toxic combination");

        group.WhyText.Should().Contain("Toxic combinations use only the paths those engines stored.");
        group.PathsEmitted.Should().Be(2);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };
}
