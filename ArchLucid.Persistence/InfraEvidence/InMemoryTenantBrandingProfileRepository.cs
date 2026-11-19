using System.Collections.Concurrent;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory tenant branding profile store for tests and in-memory hosts.</summary>
public sealed class InMemoryTenantBrandingProfileRepository : ITenantBrandingProfileRepository
{
    private readonly ConcurrentDictionary<Guid, List<TenantBrandingProfileRecord>> _profilesByTenant = new();

    public Task InsertAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(record);

        List<TenantBrandingProfileRecord> profiles = _profilesByTenant.GetOrAdd(record.TenantId, _ => []);
        lock (profiles)
        {
            if (record.BrandingStatus == BrandingProfileStatus.Active &&
                profiles.Any(p => p.BrandingStatus == BrandingProfileStatus.Active))
            {
                throw new InvalidOperationException("Only one Active branding profile is allowed per tenant.");
            }

            profiles.Add(record);
        }

        return Task.CompletedTask;
    }

    public Task<TenantBrandingProfileRecord?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Active, cancellationToken);

    public Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Default, cancellationToken);

    public Task<TenantBrandingProfileRecord?> TryGetDraftAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Draft, cancellationToken);

    public Task ReplaceDraftAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(record);

        if (record.BrandingStatus != BrandingProfileStatus.Draft)
            throw new InvalidOperationException("ReplaceDraftAsync requires a Draft profile.");

        List<TenantBrandingProfileRecord> profiles = _profilesByTenant.GetOrAdd(record.TenantId, _ => []);
        lock (profiles)
        {
            profiles.RemoveAll(p => p.BrandingStatus == BrandingProfileStatus.Draft);
            profiles.Add(record);
        }

        return Task.CompletedTask;
    }

    public Task<bool> TryActivateDraftAsync(
        TenantBrandingProfileRecord draft,
        TenantBrandingProfileRecord activated,
        CancellationToken cancellationToken = default)
    {
        if (draft.TenantId != activated.TenantId || activated.BrandingStatus != BrandingProfileStatus.Active)
            throw new InvalidOperationException("Branding activation requires an active profile for the draft tenant.");

        if (!_profilesByTenant.TryGetValue(draft.TenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult(false);

        lock (profiles)
        {
            cancellationToken.ThrowIfCancellationRequested();
            int draftIndex = profiles.FindIndex(p => p.BrandingStatus == BrandingProfileStatus.Draft &&
                p.BrandingProfileId == draft.BrandingProfileId && p.UpdatedUtc == draft.UpdatedUtc);
            if (draftIndex < 0)
                return Task.FromResult(false);

            for (int i = 0; i < profiles.Count; i++)
            {
                if (i == draftIndex || profiles[i].BrandingStatus == BrandingProfileStatus.Active)
                {
                    profiles[i] = CloneProfile(
                        profiles[i], BrandingProfileStatus.Disabled, activated.UpdatedUtc, activated.UpdatedBy);
                }
            }

            profiles.Add(activated);
        }

        return Task.FromResult(true);
    }

    public Task UpdateStatusForTenantAsync(
        Guid tenantId,
        BrandingProfileStatus fromStatus,
        BrandingProfileStatus toStatus,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.CompletedTask;

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        lock (profiles)
        {
            for (int i = 0; i < profiles.Count; i++)
            {
                TenantBrandingProfileRecord profile = profiles[i];

                if (profile.BrandingStatus != fromStatus)
                    continue;

                profiles[i] = CloneProfile(profile, toStatus, utcNow, updatedBy);
            }
        }

        return Task.CompletedTask;
    }

    public Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult(0);

        lock (profiles)
        {
            return Task.FromResult(profiles.Count(p => p.BrandingStatus == BrandingProfileStatus.Active));
        }
    }

    private Task<TenantBrandingProfileRecord?> TryGetByStatusAsync(
        Guid tenantId, BrandingProfileStatus status, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult<TenantBrandingProfileRecord?>(null);

        lock (profiles)
        {
            TenantBrandingProfileRecord? match = profiles
                .Where(p => p.BrandingStatus == status)
                .OrderByDescending(p => p.Version)
                .FirstOrDefault();

            return Task.FromResult(match);
        }
    }

    private static TenantBrandingProfileRecord CloneProfile(
        TenantBrandingProfileRecord source,
        BrandingProfileStatus status,
        DateTime updatedUtc,
        string? updatedBy) =>
        new()
        {
            BrandingProfileId = source.BrandingProfileId,
            TenantId = source.TenantId,
            CompanyDisplayName = source.CompanyDisplayName,
            CompanyLegalName = source.CompanyLegalName,
            ShortDisplayName = source.ShortDisplayName,
            LogoPrimaryAssetId = source.LogoPrimaryAssetId,
            LogoSecondaryAssetId = source.LogoSecondaryAssetId,
            LogoSquareAssetId = source.LogoSquareAssetId,
            LogoFaviconAssetId = source.LogoFaviconAssetId,
            LogoDarkAssetId = source.LogoDarkAssetId,
            LogoLightAssetId = source.LogoLightAssetId,
            LogoReportCoverAssetId = source.LogoReportCoverAssetId,
            LogoMonoAssetId = source.LogoMonoAssetId,
            PrimaryColor = source.PrimaryColor,
            SecondaryColor = source.SecondaryColor,
            AccentColor = source.AccentColor,
            BackgroundColor = source.BackgroundColor,
            ForegroundColor = source.ForegroundColor,
            TypographyJson = source.TypographyJson,
            Tagline = source.Tagline,
            WebsiteUrl = source.WebsiteUrl,
            SupportUrl = source.SupportUrl,
            BrandingStatus = status,
            Version = source.Version,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc,
            CreatedBy = source.CreatedBy,
            UpdatedBy = updatedBy,
            CoBrandingEnabled = source.CoBrandingEnabled,
        };
}
