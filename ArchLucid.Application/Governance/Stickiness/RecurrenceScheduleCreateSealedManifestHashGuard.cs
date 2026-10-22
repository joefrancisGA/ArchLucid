using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance.Stickiness;

/// <summary>Wave-26 suggestion 255: recurrence schedule create fail-closed on source run sealed hash.</summary>
public static class RecurrenceScheduleCreateSealedManifestHashGuard
{
    public static Task EnsureSourceRunSealedManifestHashOrThrowAsync(
        Guid sourceRunId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            sourceRunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
