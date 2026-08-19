using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>
///     Builds the authority-pipeline <see cref="FeasibilityVerdict" /> from a resolved
///     <see cref="ManifestDocument" /> plus optional intake provenance (ADR 0050 follow-up).
/// </summary>
public interface IAuthorityFeasibilityVerdictComposer
{
    /// <summary>
    ///     Classifies manifest health and merges intake trail entries into the mandatory output trail.
    /// </summary>
    FeasibilityVerdict Compose(
        ManifestDocument manifest,
        TransparencyTrail? intakeTransparencyTrail,
        FindingsSnapshot? findingsSnapshot = null,
        IReadOnlyList<string>? acceptedFindingIds = null);
}
