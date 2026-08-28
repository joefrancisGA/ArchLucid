using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunStatusTransitionTableTests
{
    [Fact]
    public void TryParseStatus_rejects_undefined_numeric_string_ordinals()
    {
        ArchitectureRunStatusTransitionTable.TryParseStatus("99", out ArchitectureRunStatus status).Should().BeFalse();

        status.Should().Be(default);
    }

    [Fact]
    public void TryParseStatus_accepts_defined_status_names()
    {
        ArchitectureRunStatusTransitionTable.TryParseStatus("ReadyForCommit", out ArchitectureRunStatus status).Should().BeTrue();

        status.Should().Be(ArchitectureRunStatus.ReadyForCommit);
    }
}
