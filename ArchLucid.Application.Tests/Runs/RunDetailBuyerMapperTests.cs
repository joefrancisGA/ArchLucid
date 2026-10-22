using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunDetailBuyerMapperTests
{
    [Fact]
    public void Map_copies_whitelisted_proof_fields_and_omits_snapshots()
    {
        Guid runId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid scopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        RunDetailDto source = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                ProjectId = "default",
                ScopeProjectId = scopeProjectId,
                Description = "Buyer review",
                CreatedUtc = DateTime.UtcNow,
                GoldenManifestId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                GraphSnapshotId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
                LegacyRunStatus = "PartiallyCompleted",
            },
            ExecutionFlavorBuyerSummary = "Simulator",
            TrustEvidenceCard = new Contracts.Trust.RunTrustEvidenceCard
            {
                SelfAttestationNotice = "notice",
            },
            ContextSnapshot = new Contracts.Persistence.Context.ContextSnapshot(),
            GraphSnapshot = new Contracts.Persistence.Graph.GraphSnapshot(),
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-1",
                        Title = "Public endpoint",
                        Category = "Security",
                        EngineType = "Policy",
                        Severity = FindingSeverity.Critical,
                        Rationale = "n/a",
                        FindingType = "Policy",
                        Payload = new { secret = "omit" },
                    },
                ],
            },
            Results = [new Contracts.Agents.AgentResult()],
            AgentExecutionOutcomes =
            [
                new Contracts.Agents.AgentExecutionOutcome
                {
                    AgentType = Contracts.Common.AgentType.Topology,
                    Outcome = Contracts.Agents.AgentExecutionOutcomeKind.Succeeded,
                },
                new Contracts.Agents.AgentExecutionOutcome
                {
                    AgentType = Contracts.Common.AgentType.Cost,
                    Outcome = Contracts.Agents.AgentExecutionOutcomeKind.Missing,
                },
            ],
        };

        BuyerRunDetailSummaryDto mapped = RunDetailBuyerMapper.Map(source);

        mapped.Run.RunId.Should().Be(runId);
        mapped.Run.ProjectId.Should().Be("default");
        mapped.Run.ScopeProjectId.Should().Be(scopeProjectId);
        mapped.Run.LegacyRunStatus.Should().Be("PartiallyCompleted");
        mapped.AgentExecutionOutcomes.Should().HaveCount(2);
        mapped.ExecutionFlavorBuyerSummary.Should().Be("Simulator");
        mapped.TrustEvidenceCard.Should().NotBeNull();
        mapped.Run.HasGraphSnapshot.Should().BeTrue();
        mapped.Run.HasGoldenManifest.Should().BeTrue();
        mapped.FindingSummaries.Should().ContainSingle(f => f.FindingId == "f-1" && f.Title == "Public endpoint");

        typeof(BuyerRunDetailSummaryDto).GetProperties().Select(p => p.Name).Should().NotContain(
            nameof(RunDetailDto.ContextSnapshot),
            nameof(RunDetailDto.GraphSnapshot),
            nameof(RunDetailDto.FindingsSnapshot),
            nameof(RunDetailDto.Results));
    }
}
