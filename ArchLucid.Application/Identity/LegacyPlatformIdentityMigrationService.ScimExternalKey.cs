using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class LegacyPlatformIdentityMigrationService
{
    private async Task<(ExternalIdentityKey Key, bool ReviewItemRecorded)> BuildScimExternalKeyAsync(
        LegacyScimUserMigrationRow scimUser,
        CancellationToken cancellationToken)
    {
        string? entraTenantId =
            await _legacySource.TryGetEntraTenantIdAsync(scimUser.TenantId, cancellationToken).ConfigureAwait(false);

        string normalizedIssuer;
        bool reviewItemRecorded = false;

        if (!string.IsNullOrWhiteSpace(entraTenantId) && Guid.TryParse(entraTenantId.Trim(), out Guid parsedEntraTenantId))
        {
            normalizedIssuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(parsedEntraTenantId);
        }
        else
        {
            normalizedIssuer = IdentityIssuerNormalizer.Normalize($"archlucid:entra-scim:{scimUser.TenantId:D}");

            await RecordReviewAsync(
                    ScimLegacySourceType,
                    scimUser.ScimUserId,
                    scimUser.TenantId,
                    IdentityMigrationReviewReason.MissingEntraTenantId,
                    "Tenant EntraTenantId missing; SCIM identity issuer falls back to tenant-scoped synthetic issuer.",
                    cancellationToken)
                .ConfigureAwait(false);

            reviewItemRecorded = true;
        }

        ExternalIdentityKey key = new()
        {
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            NormalizedIssuer = normalizedIssuer,
            Subject = scimUser.ExternalId.Trim(),
            TenantId = scimUser.TenantId
        };

        return (key, reviewItemRecorded);
    }
}
