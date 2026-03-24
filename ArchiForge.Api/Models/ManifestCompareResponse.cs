using ArchiForge.Application.Diffs;
using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Api.Models;

/// <summary>
/// Response returned by the manifest comparison endpoint, containing both manifests and their structural diff.
/// </summary>
public sealed class ManifestCompareResponse
{
    /// <summary>The left (baseline) manifest.</summary>
    public GoldenManifest LeftManifest { get; set; } = new();

    /// <summary>The right (candidate) manifest.</summary>
    public GoldenManifest RightManifest { get; set; } = new();

    /// <summary>Field-level diff result between the two manifests.</summary>
    public ManifestDiffResult Diff { get; set; } = new();
}
