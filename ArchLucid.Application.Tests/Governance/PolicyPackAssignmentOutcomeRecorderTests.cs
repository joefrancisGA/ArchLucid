using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

public sealed class PolicyPackAssignmentOutcomeRecorderTests
{
    [Fact]
    public void ApplyOutcomes_sets_evaluated_when_pack_signal_present()
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

        FindingsSnapshot snapshot = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
        };

        string updated = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(scopeJson, findings, snapshot);

        ExecutedEffectiveGovernanceSnapshotDescriptor? parsed =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(updated);

        parsed!.PackAssignments[0].EvaluationOutcome.Should().Be(PolicyPackEvaluationOutcomes.Evaluated);
    }

    [Fact]
    public void ApplyOutcomes_marks_evaluated_when_complete_without_pack_signal()
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
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        FindingsSnapshot snapshot = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
        };

        string updated = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(scopeJson, [], snapshot);

        ExecutedEffectiveGovernanceSnapshotDescriptor? parsed =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(updated);

        parsed!.PackAssignments[0].EvaluationOutcome.Should().Be(PolicyPackEvaluationOutcomes.Evaluated);
    }

    [Fact]
    public void ApplyOutcomes_ignores_muted_findings_when_snapshot_is_incomplete()
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
                    ComplianceRuleKeys = ["rule-muted"],
                },
            ],
        };

        string scopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);

        List<Finding> findings =
        [
            new()
            {
                FindingId = "f-muted",
                PolicyRuleId = "rule-muted",
                IsMuted = true,
            },
        ];

        FindingsSnapshot snapshot = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.Generating,
        };

        string updated = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(scopeJson, findings, snapshot);

        ExecutedEffectiveGovernanceSnapshotDescriptor? parsed =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(updated);

        parsed!.PackAssignments[0].EvaluationOutcome.Should().Be(PolicyPackEvaluationOutcomes.Skipped);
    }

    [Fact]
    public void ApplyOutcomes_marks_skipped_when_findings_snapshot_is_missing()
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

        string updated = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(scopeJson, [], findingsSnapshot: null);

        ExecutedEffectiveGovernanceSnapshotDescriptor? parsed =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(updated);

        parsed!.PackAssignments[0].EvaluationOutcome.Should().Be(PolicyPackEvaluationOutcomes.Skipped);
    }
}
