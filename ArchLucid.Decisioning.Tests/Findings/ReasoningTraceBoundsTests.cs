using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ReasoningTraceBoundsTests
{
    [Fact]
    public void Normalize_returns_null_for_blank()
    {
        (string? stored, string? digest) = ReasoningTraceBounds.Normalize("   ");

        stored.Should().BeNull();
        digest.Should().BeNull();
    }

    [Fact]
    public void Normalize_truncates_and_hashes_when_over_limit()
    {
        string longTrace = new('r', ReasoningTraceBounds.MaxStoredCharacters + 50);

        (string? stored, string? digest) = ReasoningTraceBounds.Normalize(longTrace);

        stored.Should().HaveLength(ReasoningTraceBounds.MaxStoredCharacters);
        digest.Should().NotBeNullOrWhiteSpace();
        digest.Should().HaveLength(64);
    }
}
