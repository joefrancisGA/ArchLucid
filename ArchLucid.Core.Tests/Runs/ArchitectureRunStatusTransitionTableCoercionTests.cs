using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunStatusTransitionTableCoercionTests
{
    [Fact]
    public void TryParseStatus_parses_string_encoded_whole_number_ordinal()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("4.0", out ArchitectureRunStatus status);

        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.ReadyForCommit);
    }

    [Fact]
    public void TryParseStatus_parses_5_0_fractional_string_to_committed_ordinal()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("5.0", out ArchitectureRunStatus status);

        // In-memory transition callers only; SQL CK_Runs_LegacyRunStatus allowlist stores enum names on persisted rows.
        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Committed);
    }

    [Fact]
    public void TryParseStatus_rejects_string_encoded_boolean_ordinal()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("True", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryParseStatus_rejects_on_synonym_boolean_ordinal()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("on", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryParseStatus_parses_numeric_ordinal_for_failed_partial()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("10", out ArchitectureRunStatus status);

        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.FailedPartial);
    }

    [Fact]
    public void TryParseStatus_coerces_whitespace_only_legacy_status_to_created()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("   ", out ArchitectureRunStatus status);

        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void TryParseStatus_coerces_empty_string_legacy_status_to_created()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus(string.Empty, out ArchitectureRunStatus status);

        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void TryParseStatus_rejects_negative_fractional_whole_number_ordinal()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("-5.0", out ArchitectureRunStatus status);

        // TryParseWholeNumberString requires non-negative finite values for fractional ordinals; SQL stores enum names on persisted rows.
        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_rejects_plus_prefixed_numeric_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("+5", out ArchitectureRunStatus status);

        // Enum.TryParse would coerce signed numeric strings to backing values; reject explicit leading '+' before enum parse.
        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_parses_leading_zero_whole_number_ordinal_to_committed()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("05", out ArchitectureRunStatus status);

        // int.TryParse accepts leading zeros for in-memory callers; SQL CK_Runs_LegacyRunStatus stores enum names on persisted rows.
        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Committed);
    }

    [Fact]
    public void TryParseStatus_parses_scientific_notation_whole_number_ordinal_to_committed()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("5e0", out ArchitectureRunStatus status);

        // double.TryParse floor coercion for in-memory callers; SQL CK_Runs_LegacyRunStatus stores enum names on persisted rows.
        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Committed);
    }

    [Fact]
    public void TryParseStatus_rejects_non_finite_whole_number_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("Infinity", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_rejects_nan_whole_number_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("NaN", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_rejects_hexadecimal_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("0x5", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_coerces_unicode_nbsp_whitespace_only_legacy_status_to_created()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("\u00A0", out ArchitectureRunStatus status);

        ok.Should().BeTrue();
        status.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void TryTransition_allows_commit_finalized_from_ready_for_commit()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.ReadyForCommit,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeTrue();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Committed);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_tasks_generated()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.TasksGenerated,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.TasksGenerated);
        result.DenialReason.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryTransition_denies_retry_requested_from_created()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.Created,
            ArchitectureRunStatusLifecycleEvent.RetryRequested);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_waiting_for_results()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.WaitingForResults,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.WaitingForResults);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_created()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.Created,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_failed()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.Failed,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Failed);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_retrying()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.Retrying,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Retrying);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_failed_partial()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.FailedPartial,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.FailedPartial);
    }

    [Fact]
    public void DocumentedRules_does_not_return_mutable_shared_rules_array()
    {
        IReadOnlyList<ArchitectureRunStatusTransitionRule> documented =
            ArchitectureRunStatusTransitionTable.DocumentedRules;

        documented.Should().NotBeOfType<ArchitectureRunStatusTransitionRule[]>(
            "callers must not cast DocumentedRules to the shared Rules backing array");
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_execution_completed_quality_rejected()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.ExecutionCompletedQualityRejected,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.ExecutionCompletedQualityRejected);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_partially_completed()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.PartiallyCompleted,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.PartiallyCompleted);
    }

    [Fact]
    public void TryTransition_denies_commit_finalized_from_committed()
    {
        ArchitectureRunStatusTransitionResult result = ArchitectureRunStatusTransitionTable.TryTransition(
            ArchitectureRunStatus.Committed,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized);

        result.IsAllowed.Should().BeFalse();
        result.TargetStatus.Should().Be(ArchitectureRunStatus.Committed);
    }

    [Fact]
    public void TryParseStatus_rejects_negative_integer_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("-6", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_rejects_whole_number_double_outside_int32_range()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("4294967296.0", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
    }
}
