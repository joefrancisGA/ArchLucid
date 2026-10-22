using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     ADR 0073: empty asserted/inferred/skipped arrays are legal on finalize; a null trail is not.
/// </summary>
public static class ArchitectureRequestIntakeTrailHydrator
{
    /// <summary>
    ///     Direct CreateRun paths (API, CLI, golden cohort) never went through draft intake, so persist
    ///     an empty trail rather than leaving provenance unrecorded.
    /// </summary>
    public static void EnsureTrail(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        request.IntakeTransparencyTrail ??= new TransparencyTrail();
    }
}
