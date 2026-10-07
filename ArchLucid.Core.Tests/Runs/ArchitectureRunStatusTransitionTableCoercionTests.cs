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
    public void TryParseStatus_rejects_hexadecimal_ordinal_string()
    {
        bool ok = ArchitectureRunStatusTransitionTable.TryParseStatus("0x5", out ArchitectureRunStatus status);

        ok.Should().BeFalse();
        status.Should().Be(default);
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
}
