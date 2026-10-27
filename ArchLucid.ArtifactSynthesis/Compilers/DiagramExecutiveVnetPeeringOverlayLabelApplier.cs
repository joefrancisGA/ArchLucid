using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Executive VNet peering overlay is intentionally a no-op: blank or omission-labeled
///     VNet pairs must not be stamped as observed peering when the graph did not store the relationship.
/// </summary>
internal static class DiagramExecutiveVnetPeeringOverlayLabelApplier
{
    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);
    }
}
