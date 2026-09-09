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
}
