using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotCommittedManifestStatusHonestyCopy
{
    internal const string NotSponsorCompletePlain =
        "No committed architecture manifest or run is not Committed — there is nothing sponsor-complete to ship yet.";

    internal static string FormatProofPackageCell(ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(c);

        return c is { CommittedManifestPresent: true, RunInCommittedStatus: true }
            ? "Present"
            : NotSponsorCompletePlain;
    }

    internal static string FormatSponsorSafeConcreteGapLine() => NotSponsorCompletePlain;
}
