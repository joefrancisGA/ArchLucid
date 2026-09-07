using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Findings;

public sealed class InMemoryFindingInsightSignalRepositoryNoveltyRateTests
{
    [Fact]
    public async Task ListNoveltyRatesAsync_aggregates_decision_grade_findings_with_novelty_signals()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        };

        DateTime snapshotUtc = new(2026, 9, 1, 12, 0, 0, DateTimeKind.Utc);
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = snapshotUtc,
            Findings =
            [
                new Finding
                {
                    FindingId = "finding-a",
                    EngineType = "security-baseline",
                    Classification = FindingClassification.DecisionGradeFinding,
                    FindingType = "T",
                    Category = "Security",
                    Title = "A",
                    Rationale = "A",
                    Severity = FindingSeverity.Info,
                },
                new Finding
                {
                    FindingId = "finding-b",
                    EngineType = "security-baseline",
                    Classification = FindingClassification.DecisionGradeFinding,
                    FindingType = "T",
                    Category = "Security",
                    Title = "B",
                    Rationale = "B",
                    Severity = FindingSeverity.Info,
                },
            ],
        };

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.ListRunsInScopeKeysetAsync(
                scope,
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                (IReadOnlyList<RunSummaryDto>)
                [
                    new RunSummaryDto
                    {
                        RunId = runId,
                        CreatedUtc = snapshotUtc,
                    },
                ],
                false));
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>(), false))
            .ReturnsAsync(new RunDetailDto { FindingsSnapshot = snapshot });

        InMemoryFindingInsightSignalRepository repository = new(authorityQuery.Object);

        await repository.TryInsertAsync(new FindingInsightSignalSubmission
        {
            TenantId = tenantId,
            RunId = runId,
            FindingId = "finding-a",
            UserId = "operator@test",
            Kind = FindingInsightSignalKind.DidNotThinkOfThat,
        });

        IReadOnlyList<EngineInsightNoveltyRateRow> rows = await repository.ListNoveltyRatesAsync(
            scope,
            snapshotUtc.AddDays(-1),
            snapshotUtc.AddDays(1));

        rows.Should().ContainSingle();
        rows[0].EngineType.Should().Be("security-baseline");
        rows[0].DecisionGradeCount.Should().Be(2);
        rows[0].DidNotThinkOfThatCount.Should().Be(1);
        rows[0].Rate.Should().Be(0.5);
    }
}
