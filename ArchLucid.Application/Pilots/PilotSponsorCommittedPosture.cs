using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared sponsor-complete commit posture for gate-aligned export surfaces.</summary>
internal static class PilotSponsorCommittedPosture
{
    internal static bool HasCompleteCommittedPosture(ArchitectureRun run, GoldenManifest? manifest)
    {
        ArgumentNullException.ThrowIfNull(run);

        return manifest is not null && run.Status == ArchitectureRunStatus.Committed;
    }
}
