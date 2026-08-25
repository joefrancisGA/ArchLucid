using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;
using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

public sealed class FindingMergeConflictPresenterTests
{
    [Fact]
    public void PresentAsFindings_maps_merge_conflict_engine_failures_to_warning_rows()
    {
        FindingEngineFailure conflict = new()
        {
            EngineType = FindingSnapshotConfluentMerger.ConflictEngineType,
            Category = "Security",
            ErrorMessage = "Finding merge conflict on ADR 0063 key.",
            ExceptionType = FindingSnapshotConfluentMerger.ConflictExceptionType,
            OccurredUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        };

        IReadOnlyList<Finding> rows = FindingMergeConflictPresenter.PresentAsFindings(
            [conflict],
            TimeProvider.System);

        rows.Should().ContainSingle();
        rows[0].FindingType.Should().Be(FindingMergeConflictPresenter.FindingType);
        rows[0].Severity.Should().Be(FindingSeverity.Warning);
        rows[0].PolicyRuleId.Should().Be(FindingMergeConflictPresenter.PolicyRuleId);
        rows[0].Properties["findingMerge.conflict"].Should().Be(bool.TrueString);
    }

    [Fact]
    public void GenerateFindingsSnapshotAsync_includes_merge_conflict_rows_when_payloads_differ()
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
            failure.EngineType == FindingSnapshotConfluentMerger.ConflictEngineType);
    }
}
