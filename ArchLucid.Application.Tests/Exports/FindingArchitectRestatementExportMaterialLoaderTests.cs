using ArchLucid.Application.Exports;
using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingArchitectRestatementExportMaterialLoaderTests
{
    [Fact]
    public async Task LoadForRunAsync_uses_finding_message_not_stored_when_message_blank()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f-1",
                            Category = "Security",
                            Message = "   ",
                        },
                    ],
                },
            ],
        };

        Mock<IFindingReviewTrailRepository> trailRepository = new();
        trailRepository
            .Setup(r => r.ListForFindingIdsSinceUtcAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = "f-1",
                    ArchitectRestatement = "Restated for export.",
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        IReadOnlyList<FindingArchitectRestatementExportRow> rows =
            await FindingArchitectRestatementExportMaterialLoader.LoadForRunAsync(
                detail,
                trailRepository.Object,
                scope,
                CancellationToken.None);

        rows.Should().ContainSingle();
        rows[0].FindingTitle.Should().Be(ArchitectureRunFindingsCsvFormatter.FindingMessageNotStoredLabel);
    }
}
