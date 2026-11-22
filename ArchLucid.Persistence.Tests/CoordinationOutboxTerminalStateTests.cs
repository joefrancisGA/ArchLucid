using ArchLucid.Persistence.Coordination;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoordinationOutboxTerminalStateTests
{
    [Fact]
    public void CanMarkProcessed_rejects_existing_terminal_state()
    {
        DateTime terminalUtc = new(2026, 11, 19, 10, 0, 0, DateTimeKind.Utc);

        CoordinationOutboxRepositoryCore.CanMarkProcessed(null, null).Should().BeTrue();
        CoordinationOutboxRepositoryCore.CanMarkProcessed(terminalUtc, null).Should().BeFalse();
        CoordinationOutboxRepositoryCore.CanMarkProcessed(null, terminalUtc).Should().BeFalse();
    }
}
