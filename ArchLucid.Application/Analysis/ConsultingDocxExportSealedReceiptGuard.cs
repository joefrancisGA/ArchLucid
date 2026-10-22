using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-22 suggestion 213: public API surface for consulting DOCX sealed-receipt verification from HTTP hosts.</summary>
public static class ConsultingDocxExportSealedReceiptGuard
{
    public static Task EnsureVerifiedOrThrowAsync(
        Guid runGuid,
        string runIdLabel,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken) =>
        ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
            runGuid,
            runIdLabel,
            authorityQueryService,
            manifestHashService,
            scope,
            cancellationToken);
}
