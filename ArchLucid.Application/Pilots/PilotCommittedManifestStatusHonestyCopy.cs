using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
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

    internal static string FormatProofPackageCell(ArchitectureRun run, GoldenManifest? manifest)
    {
        ArgumentNullException.ThrowIfNull(run);

        return manifest is not null && run.Status == ArchitectureRunStatus.Committed
            ? "Present"
            : NotSponsorCompletePlain;
    }

    internal static string FormatSponsorSafeConcreteGapLine() => NotSponsorCompletePlain;
}
