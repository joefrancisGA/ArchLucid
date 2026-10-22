using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Wave-34 suggestions 392–394: audit architecture evidence fail-closed on sealed manifest hash.</summary>
public static class AuditArchitectureEvidenceSealedManifestHashGuard
{
    public static async Task EnsureLinkedRunsSealedManifestHashOrThrowAsync(
        IReadOnlyList<AuditArchitectureEvidenceLinkRecord> architectureLinks,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(architectureLinks);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        foreach (Guid runId in architectureLinks
                     .Select(link => link.RunId)
                     .Where(candidate => candidate != Guid.Empty)
                     .Distinct())
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
