using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Findings;

/// <summary>Wave-23 suggestion 230: finding inspect fail-closed when evidence items are not pin/inventory-bound.</summary>
public static class FindingInspectPinnedEvidenceGuard
{
    public static async Task EnsureInspectEvidenceInventoryBoundOrThrowAsync(
        FindingInspectResponse inspect,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(inspect);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);

        if (inspect.Evidence.Count == 0)
            return;

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, inspect.RunId, cancellationToken);

        ManifestDocument? goldenManifest = detail?.GoldenManifest;

        if (goldenManifest is null)
        {
            throw new ConflictException(
                $"Finding inspect blocked for finding '{inspect.FindingId}': committed golden manifest is missing.");
        }

        if (goldenManifest.CommittedArtifactInventory.Count == 0)
        {
            throw new ConflictException(
                $"Finding inspect blocked for finding '{inspect.FindingId}': evidence citations are not inventory-bound.");
        }

        foreach (FindingInspectEvidenceItem item in inspect.Evidence)
        {
            if (string.IsNullOrWhiteSpace(item.ArtifactId))
                continue;

            bool bound = goldenManifest.CommittedArtifactInventory.Any(row =>
                string.Equals(row.ArtifactName, item.ArtifactId.Trim(), StringComparison.OrdinalIgnoreCase));

            if (!bound)
            {
                throw new ConflictException(
                    $"Finding inspect blocked for finding '{inspect.FindingId}': evidence artifact '{item.ArtifactId}' is not inventory-bound.");
            }
        }
    }
}
