using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;

namespace ArchLucid.Application.Findings;

/// <summary>Copies overlay <c>ScorerVersion</c> onto live finding models (LY-018).</summary>
public static class FindingSemanticSupportBandOverlayScorerVersionApplier
{
    public static void Apply(ArchitectureFinding finding, FindingSemanticSupportBandOverlayRecord overlay)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(overlay);

        if (string.IsNullOrWhiteSpace(overlay.ScorerVersion))
            return;

        finding.SemanticSupportBandScorerVersion = overlay.ScorerVersion.Trim();
    }

    public static void Apply(Finding finding, FindingSemanticSupportBandOverlayRecord overlay)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(overlay);

        if (string.IsNullOrWhiteSpace(overlay.ScorerVersion))
            return;

        finding.SemanticSupportBandScorerVersion = overlay.ScorerVersion.Trim();
    }
}
