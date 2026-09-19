namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Shared pictogram-kind accent fills for forest cards and category glyphs.</summary>
public static class DiagramInventoryPictogramKindColors
{
    public static string FillFor(DiagramInventoryPictogramKind kind)
    {
        return kind switch
        {
            DiagramInventoryPictogramKind.Compute => "#2563eb",
            DiagramInventoryPictogramKind.Network => "#0f766e",
            DiagramInventoryPictogramKind.Data => "#7c3aed",
            DiagramInventoryPictogramKind.Storage => "#d97706",
            DiagramInventoryPictogramKind.Identity => "#db2777",
            _ => "#475569",
        };
    }
}
