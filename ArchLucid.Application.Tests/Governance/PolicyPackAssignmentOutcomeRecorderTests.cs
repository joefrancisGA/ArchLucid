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

    [Fact]
    public void ApplyOutcomes_marks_skipped_when_complete_without_pack_signal()
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

        parsed!.PackAssignments[0].EvaluationOutcome.Should().Be(PolicyPackEvaluationOutcomes.Skipped);
    }
}
