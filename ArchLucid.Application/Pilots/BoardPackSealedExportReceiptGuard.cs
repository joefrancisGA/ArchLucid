using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Pilots;

/// <summary>Wave-25 suggestion 243: quarterly board-pack PDF fail-closed on sealed export receipt.</summary>
public static class BoardPackSealedExportReceiptGuard
{
    public static Task EnsureVerifiedOrThrowAsync(
        Guid runGuid,
        string runIdLabel,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken) =>
        ConsultingDocxExportSealedReceiptGuard.EnsureVerifiedOrThrowAsync(
            runGuid,
            runIdLabel,
            authorityQueryService,
            manifestHashService,
            scope,
            cancellationToken);
}
