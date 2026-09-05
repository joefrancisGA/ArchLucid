using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>Wave-28 suggestion 289: commit sponsor email dispatch re-verify sealed hash before send.</summary>
public static class CommitSponsorEmailDispatchSealedManifestHashGuard
{
    public static Task EnsureRunSealedOrThrowAsync(
        Guid tenantId,
        string runId,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (tenantId == Guid.Empty)
            return Task.CompletedTask;

        if (!Guid.TryParse(runId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
        {
            throw new ConflictException(
                $"Commit sponsor email blocked: run id '{runId}' is not a valid GUID.");
        }

        ScopeContext scope = new() { TenantId = tenantId };

        return GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runGuid,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
