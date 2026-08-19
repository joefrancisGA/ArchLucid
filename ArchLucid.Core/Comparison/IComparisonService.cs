using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Comparison;

/// <summary>Compares two golden manifest snapshots into a structured <see cref="ComparisonResult" />.</summary>
public interface IComparisonService
{
    ComparisonResult Compare(ManifestDocument baseManifest, ManifestDocument targetManifest);
}
