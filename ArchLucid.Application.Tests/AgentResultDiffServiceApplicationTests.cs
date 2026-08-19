using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

/// <summary>
/// Additional <see cref="AgentResultDiffService"/> scenarios (latest result per agent type, empty inputs).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultDiffServiceApplicationTests
{
    private readonly CrossReviewFindingCorrelationService _correlationService = new();

    private AgentResultDiffService CreateSut() => new(_correlationService);

    [SkippableFact]
    public void Compare_uses_latest_result_per_agent_type_by_CreatedUtc()
    {
        DateTime older = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);

        AgentResult[] left =
        [
            new()
            {
                ResultId = "r-old",
                TaskId = "t1",
                RunId = "L",
                AgentType = AgentType.Topology,
                Claims = ["old"],
                CreatedUtc = older,
            },
            new()
            {
                ResultId = "r-new",
                TaskId = "t2",
                RunId = "L",
                AgentType = AgentType.Topology,
                Claims = ["new"],
                CreatedUtc = newer,
            },
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "r3",
                TaskId = "t3",
                RunId = "R",
                AgentType = AgentType.Topology,
                Claims = ["new"],
                CreatedUtc = newer,
            },
        ];

        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", left, "R", right);

        diff.AgentDeltas.Should().ContainSingle();
        diff.AgentDeltas[0].RemovedClaims.Should().BeEmpty();
        diff.AgentDeltas[0].AddedClaims.Should().BeEmpty();
    }

    [SkippableFact]
    public void Compare_when_no_results_emits_warning()
    {
        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", [], "R", []);

        diff.Warnings.Should().Contain("No agent results were available to compare.");
    }

    [SkippableFact]
    public void Compare_agent_only_on_right_marks_left_missing()
    {
        AgentResult[] right =
        [
            new()
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = "R",
                AgentType = AgentType.Cost,
                Claims = ["c"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
        ];

        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", [], "R", right);

        AgentResultDelta delta = diff.AgentDeltas.Should().ContainSingle().Subject;
        delta.LeftExists.Should().BeFalse();
        delta.RightExists.Should().BeTrue();
    }

    [SkippableFact]
    public void Compare_findings_use_fingerprint_correlation_instead_of_raw_message_text()
    {
        AgentResult[] left =
        [
            new()
            {
                ResultId = "r-left",
                TaskId = "t-left",
                RunId = "L",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "left-1",
                        Category = "Security",
                        Message = "Public  storage",
                    },
                ],
            },
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "r-right",
                TaskId = "t-right",
                RunId = "R",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "right-1",
                        Category = "Security",
                        Message = "Public storage",
                    },
                ],
            },
        ];

        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", left, "R", right);

        AgentResultDelta delta = diff.AgentDeltas.Should().ContainSingle().Subject;
        delta.AddedFindings.Should().BeEmpty();
        delta.RemovedFindings.Should().BeEmpty();
    }

    [SkippableFact]
    public void Compare_findings_with_policy_rule_match_across_different_finding_ids()
    {
        AgentResult[] left =
        [
            new()
            {
                ResultId = "r-left",
                TaskId = "t-left",
                RunId = "L",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "left-1",
                        PolicyRuleId = "rule-a",
                        Category = "Security",
                        Message = "Public storage",
                    },
                ],
            },
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "r-right",
                TaskId = "t-right",
                RunId = "R",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "right-1",
                        PolicyRuleId = "rule-a",
                        Category = "Security",
                        Message = "Public storage",
                    },
                ],
            },
        ];

        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", left, "R", right);

        AgentResultDelta delta = diff.AgentDeltas.Should().ContainSingle().Subject;
        delta.AddedFindings.Should().BeEmpty();
        delta.RemovedFindings.Should().BeEmpty();
    }

    [SkippableFact]
    public void Compare_duplicate_left_findings_do_not_surface_false_removed_when_right_still_has_message()
    {
        AgentResult[] left =
        [
            new()
            {
                ResultId = "r-left",
                TaskId = "t-left",
                RunId = "L",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "left-1",
                        Category = "Security",
                        Message = "Public storage",
                    },
                    new()
                    {
                        FindingId = "left-2",
                        Category = "Security",
                        Message = "Public storage",
                    },
                ],
            },
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "r-right",
                TaskId = "t-right",
                RunId = "R",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new()
                    {
                        FindingId = "right-1",
                        Category = "Security",
                        Message = "Public storage",
                    },
                ],
            },
        ];

        AgentResultDiffService sut = CreateSut();

        AgentResultDiffResult diff = sut.Compare("L", left, "R", right);

        AgentResultDelta delta = diff.AgentDeltas.Should().ContainSingle().Subject;
        delta.AddedFindings.Should().BeEmpty();
        delta.RemovedFindings.Should().BeEmpty();
    }
}
