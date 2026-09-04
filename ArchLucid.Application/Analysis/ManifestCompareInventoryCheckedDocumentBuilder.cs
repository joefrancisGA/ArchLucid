using System.Text.Json;

using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Wave-20 suggestion 195: apply inventory-checked coordinator projection before run-id manifest compare.
/// </summary>
internal static class ManifestCompareInventoryCheckedDocumentBuilder
{
    private static readonly JsonSerializerOptions CloneOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static ManifestDocument ApplyProjectedTopology(ManifestDocument source, Cm.GoldenManifest projected)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(projected);

        ManifestDocument compareDocument = JsonSerializer.Deserialize<ManifestDocument>(
                                             JsonSerializer.Serialize(source, CloneOptions),
                                             CloneOptions)
                                         ?? throw new InvalidOperationException(
                                             "Failed to clone manifest document for inventory-checked compare.");

        compareDocument.Topology.Services = [.. projected.Services];
        compareDocument.Topology.Datastores = [.. projected.Datastores];
        compareDocument.Topology.Relationships = [.. projected.Relationships];

        return compareDocument;
    }

    /// <summary>Wave-21 suggestion 202: inventory-checked topology overlay for version-string golden-manifest compare.</summary>
    public static GoldenManifest ApplyProjectedTopologyToGoldenManifest(
        ManifestDocument source,
        GoldenManifest projected)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(projected);

        GoldenManifest compareManifest = JsonSerializer.Deserialize<GoldenManifest>(
                                             JsonSerializer.Serialize(projected, CloneOptions),
                                             CloneOptions)
                                         ?? throw new InvalidOperationException(
                                             "Failed to clone golden manifest for inventory-checked compare.");

        compareManifest.RunId = source.RunId == Guid.Empty
            ? projected.RunId
            : source.RunId.ToString("N");
        compareManifest.Services = [.. projected.Services];
        compareManifest.Datastores = [.. projected.Datastores];
        compareManifest.Relationships = [.. projected.Relationships];

        return compareManifest;
    }
}
