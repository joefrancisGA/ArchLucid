using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Artifacts;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-15 suggestion 142: canonical UTF-8 bytes for artifact bundle inventory hashing.
/// </summary>
internal static class ManifestCommittedArtifactInventoryBundleMaterialSerializer
{
    public static byte[] SerializeCanonicalUtf8(ArtifactBundle bundle)
    {
        ArgumentNullException.ThrowIfNull(bundle);

        object canonical = new
        {
            bundleId = bundle.BundleId.ToString("D"),
            manifestId = bundle.ManifestId.ToString("D"),
            runId = bundle.RunId.ToString("D"),
            status = bundle.Status.ToString(),
            artifacts = bundle.Artifacts
                .OrderBy(static artifact => artifact.ArtifactId)
                .Select(static artifact => new
                {
                    artifact.ArtifactId,
                    artifact.Name,
                    artifact.ArtifactType,
                    artifact.Format,
                    contentHash = artifact.ContentHash,
                    artifact.Status,
                })
                .ToArray(),
            trace = new
            {
                bundle.Trace.TraceId,
                generatorsUsed = bundle.Trace.GeneratorsUsed.OrderBy(static name => name, StringComparer.Ordinal).ToArray(),
                sourceDecisionIds = bundle.Trace.SourceDecisionIds.OrderBy(static id => id, StringComparer.Ordinal).ToArray(),
            },
        };

        return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(canonical, ContractJson.Default));
    }
}
