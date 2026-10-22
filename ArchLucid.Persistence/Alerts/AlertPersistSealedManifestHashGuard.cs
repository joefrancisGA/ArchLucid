using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Wave-27 suggestion 265: alert persist fail-closed on run sealed hash before repository write.</summary>
public static class AlertPersistSealedManifestHashGuard
{
    public static Task EnsureAlertRunSealedManifestHashOrThrowAsync(
        AlertRecord alert,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        AlertDeliverySealedManifestHashGuard.EnsureAlertRunSealedManifestHashOrThrowAsync(
            alert,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
