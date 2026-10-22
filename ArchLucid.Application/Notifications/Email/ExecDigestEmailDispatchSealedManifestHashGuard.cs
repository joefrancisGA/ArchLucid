using ArchLucid.Application.ExecDigest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>Wave-26 suggestion 268: exec digest email dispatch re-verify sealed hash before send.</summary>
public static class ExecDigestEmailDispatchSealedManifestHashGuard
{
    public static async Task EnsureCompositionRunsSealedOrThrowAsync(
        ExecDigestComposition composition,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(composition);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        HashSet<string> runIds = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(composition.LatestCommittedRunIdHex))
            runIds.Add(composition.LatestCommittedRunIdHex.Trim());

        foreach (ExecDigestHighlightedRun highlight in composition.TopManifestRuns)
        {
            if (!string.IsNullOrWhiteSpace(highlight.RunIdHex))
                runIds.Add(highlight.RunIdHex.Trim());
        }

        foreach (string runIdHex in runIds)
        {
            if (!Guid.TryParse(runIdHex, out Guid runGuid) || runGuid == Guid.Empty)
                continue;

            await ExecDigestSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
