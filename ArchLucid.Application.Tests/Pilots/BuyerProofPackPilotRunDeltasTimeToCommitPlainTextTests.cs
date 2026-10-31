using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

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

    [Fact]
    public void FormatPlainText_when_wall_clock_missing_uses_shared_no_manifest_prose()
    {
        PilotRunDeltasTimeToCommitFormatter.FormatPlainText(new PilotRunDeltas { TimeToCommittedManifest = null })
            .Should()
            .Be(PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain);
    }

    [Fact]
    public void FormatPlainText_when_run_not_committed_matches_proof_package_not_wall_clock_prose()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            CommittedManifestPresent = false,
            RunInCommittedStatus = false,
            TimeToCommittedManifestResolved = false,
        };

        string plain = PilotRunDeltasTimeToCommitFormatter.FormatPlainText(
            new PilotRunDeltas { TimeToCommittedManifest = null },
            proof);

        plain.Should().Be(PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain);
        plain.Should().NotBe(PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain);
    }
}
