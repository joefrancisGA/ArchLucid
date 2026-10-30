using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotRunDeltasTimeToCommitPlainTextTests
{
    [Fact]
    public void FormatPlainText_when_wall_present_but_committed_utc_missing_uses_not_stored_copy()
    {
        PilotRunDeltas deltas = new()
        {
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            ManifestCommittedUtc = null,
        };

        PilotRunDeltasTimeToCommitFormatter.FormatPlainText(deltas)
            .Should()
            .Contain("Committed time was not stored.");
    }
}
