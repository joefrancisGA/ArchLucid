using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingSnapshotConfluentMergerPolicyRuleTests
{
    [Fact]
    public void Merge_joins_on_policy_rule_id_and_fingerprint_not_first_wins_title()
    {
        Finding engineA = new()
        {
            FindingId = "a",
            FindingType = "Test",
            Category = "Security",
            EngineType = "engine-b",
            PolicyRuleId = "rule-1",
            Title = "Shared title",
            Rationale = "same payload",
            Severity = FindingSeverity.Warning,
        };

        Finding engineB = new()
        {
            FindingId = "b",
            FindingType = "Test",
            Category = "Security",
            EngineType = "engine-a",
            PolicyRuleId = "rule-1",
            Title = "Shared title",
            Rationale = "same payload",
            Severity = FindingSeverity.Warning,
        };

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Findings = [],
        };

        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(snapshot, [engineA, engineB], TimeProvider.System);

        snapshot.Findings.Should().ContainSingle();
        snapshot.Findings[0].EngineType.Should().Be("engine-a");
        snapshot.EngineFailures.Should().BeEmpty();
    }

    [Fact]
    public void Merge_emits_conflict_when_same_key_payloads_differ()
    {
        Finding first = new()
        {
            FindingId = "a",
            FindingType = "Test",
            Category = "Security",
            EngineType = "engine-a",
            PolicyRuleId = "rule-1",
            Title = "Shared title",
            Rationale = "payload-a",
            Severity = FindingSeverity.Warning,
        };

        Finding second = new()
        {
            FindingId = "b",
            FindingType = "Test",
            Category = "Security",
            EngineType = "engine-b",
            PolicyRuleId = "rule-1",
            Title = "Shared title",
            Rationale = "payload-b",
            Severity = FindingSeverity.Critical,
        };

        FindingsSnapshot snapshot = new() { Findings = [] };

        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(snapshot, [first, second], TimeProvider.System);

        snapshot.Findings.Should().HaveCount(2);
        snapshot.Findings.Should().Contain(finding =>
            finding.FindingType == FindingMergeConflictPresenter.FindingType);
        snapshot.EngineFailures.Should().ContainSingle(failure =>
            failure.EngineType == "finding-merge-conflict");
    }
}
