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
}
