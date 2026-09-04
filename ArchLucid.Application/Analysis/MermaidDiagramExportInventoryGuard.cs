using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-22 suggestion 216: Mermaid PNG export fail-closed when diagram source is not inventory-bound.</summary>
public static class MermaidDiagramExportInventoryGuard
{
    public static void EnsureDiagramSourceInventoryBoundOrThrow(
        ManifestDocument? goldenManifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        string runIdLabel)
    {
        ArgumentNullException.ThrowIfNull(artifacts);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        string? mermaidSource = MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts);

        if (string.IsNullOrWhiteSpace(mermaidSource))
            return;

        if (goldenManifest is null)
        {
            throw new ConflictException(
                $"Run export blocked for run '{runIdLabel}': Mermaid diagram source exists but committed golden manifest is missing.");
        }

        if (goldenManifest.CommittedArtifactInventory.Count == 0)
        {
            throw new ConflictException(
                $"Run export blocked for run '{runIdLabel}': Mermaid diagram source is not bound to committed artifact inventory.");
        }

        bool hasBundleInventory = goldenManifest.CommittedArtifactInventory
            .Any(row => string.Equals(row.ArtifactName, "artifact-bundle", StringComparison.OrdinalIgnoreCase));

        if (!hasBundleInventory)
        {
            throw new ConflictException(
                $"Run export blocked for run '{runIdLabel}': Mermaid diagram source requires sealed artifact-bundle inventory row.");
        }
    }
}
