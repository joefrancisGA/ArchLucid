using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackCoverageProofEvaluatorTests
{
    [Fact]
    public void Evaluate_counts_assignments_from_web_camel_case_governance_scope_json()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ExecutedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0",
                    EvaluationOutcome = PolicyPackEvaluationOutcomes.Evaluated,
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(scopeJson, []);

        proof.AssignmentCount.Should().Be(1);
        proof.UnprovenAssignmentCount.Should().Be(0);
    }

    [Fact]
    public void Evaluate_treats_evaluated_outcome_as_proven_without_pack_finding_signal()
    {
        Guid packId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ExecutedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0",
                    EvaluationOutcome = PolicyPackEvaluationOutcomes.Evaluated,
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(scopeJson, []);

        proof.UnprovenAssignmentCount.Should().Be(0);
    }

    [Fact]
    public void Evaluate_counts_skipped_outcome_as_unproven()
    {
        Guid packId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ExecutedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0",
                    EvaluationOutcome = PolicyPackEvaluationOutcomes.Skipped,
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(scopeJson, []);

        proof.AssignmentCount.Should().Be(1);
        proof.UnprovenAssignmentCount.Should().Be(1);
    }

    [Fact]
    public void Evaluate_treats_matching_finding_as_proven_when_outcome_not_recorded()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ExecutedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0",
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        List<Finding> findings =
        [
            new()
            {
                FindingId = "f-1",
                PolicyRuleId = $"policy-pack-{packId:D}-rule-1",
            },
        ];

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(scopeJson, findings);

        proof.AssignmentCount.Should().Be(1);
        proof.UnprovenAssignmentCount.Should().Be(0);
    }

    [Fact]
    public void Evaluate_treats_pack_engine_type_as_proven_when_compliance_rule_keys_miss()
    {
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        ExecutedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0",
                    ComplianceRuleKeys = ["listed-rule-only"],
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        List<Finding> findings =
        [
            new()
            {
                FindingId = "f-pack-engine",
                PolicyRuleId = "unrelated-rule-key",
                EngineType = $"policy-pack:{packId:D}",
            },
        ];

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(scopeJson, findings);

        proof.UnprovenAssignmentCount.Should().Be(0);
    }
}
