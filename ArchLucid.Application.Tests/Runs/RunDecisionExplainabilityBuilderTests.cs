using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
public sealed class RunDecisionExplainabilityBuilderTests
{
    [Fact]
    public void Build_unifies_authority_manifest_and_coordinator_sections()
    {
        Guid contextId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid graphId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid findingsId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid traceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = Guid.Parse("11111111-1111-1111-1111-111111111111") },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                DecisionTraceId = traceId,
                RuleSetId = "baseline",
                RuleSetVersion = "1.0",
                AppliedRuleIds = ["rule-1"],
                AcceptedFindingIds = ["finding-1"],
                RequiredFindingIds = ["finding-1"],
                ContextSnapshotId = contextId,
                GraphSnapshotId = graphId,
                FindingsSnapshotId = findingsId,
            }),
            GoldenManifest = new ManifestDocument
            {
                ContextSnapshotId = contextId,
                GraphSnapshotId = graphId,
                FindingsSnapshotId = findingsId,
                Decisions =
                [
                    new ResolvedArchitectureDecision
                    {
                        DecisionId = "dec-1",
                        Category = "Security",
                        Title = "Encrypt data at rest",
                        SelectedOption = "Required",
                        Rationale = "Accepted by rule engine.",
                        Confidence = 82,
                        ConfidenceSource = DecisionConfidenceSource.FindingEvaluation,
                        SupportingFindingIds = ["finding-1"],
                    },
                ],
            },
        };

        IReadOnlyList<DecisionNodeRecord> coordinatorNodes =
        [
            new DecisionNodeRecord
            {
                DecisionId = "node-1",
                Topic = "TopologyAcceptance",
                Rationale = "Topology proposal retained.",
                Confidence = 0.74,
            },
        ];

        RunDecisionExplainabilityDto built = RunDecisionExplainabilityBuilder.Build(detail, coordinatorNodes);

        built.AuthorityRuleAudit.Should().NotBeNull();
        built.AuthorityRuleAudit!.RuleSetId.Should().Be("baseline");
        built.AuthorityRuleAudit.RequiredFindingIds.Should().ContainSingle().Which.Should().Be("finding-1");
        built.ManifestDecisions.Should().HaveCount(1);
        built.ManifestDecisions[0].BuyerConfidenceSource.Should().Be("Evidence-backed");
        built.CoordinatorDecisionNodes.Should().HaveCount(1);
        built.CoordinatorDecisionNodes[0].Pipeline.Should().Be("coordinator_v2");
        built.SnapshotIds.ContextSnapshotId.Should().Be(contextId);
    }

    [Fact]
    public void Build_surfaces_finding_engine_failures_and_manifest_honesty_warnings()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = Guid.Parse("11111111-1111-1111-1111-111111111111") },
            FindingsSnapshot = new FindingsSnapshot
            {
                EngineFailures =
                [
                    new FindingEngineFailure
                    {
                        EngineType = "SecurityEngine",
                        Category = "Security",
                        ErrorMessage = "timeout",
                        ExceptionType = "TimeoutException",
                        DurationMs = 1200,
                        OccurredUtc = DateTime.UtcNow,
                    },
                ],
            },
            GoldenManifest = new ManifestDocument
            {
                Warnings = ["Degraded finding coverage: one or more finding engines failed during snapshot generation."],
            },
        };

        RunDecisionExplainabilityDto built = RunDecisionExplainabilityBuilder.Build(detail, []);

        built.FindingEngineFailures.Should().ContainSingle();
        built.FindingEngineFailures[0].EngineType.Should().Be("SecurityEngine");
        built.ManifestHonestyWarnings.Should().ContainSingle();
    }
}
