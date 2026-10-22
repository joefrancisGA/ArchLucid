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
        ArgumentNullException.ThrowIfNull(record);

        if (record.BrandingStatus == BrandingProfileStatus.Active)
        {
            int activeCount = _profilesByTenant.GetOrAdd(record.TenantId, _ => []).Count(
                p => p.BrandingStatus == BrandingProfileStatus.Active);

            if (activeCount > 0)
                throw new InvalidOperationException("Only one Active branding profile is allowed per tenant.");
        }

        _profilesByTenant.AddOrUpdate(
            record.TenantId,
            _ => [record],
            (_, list) =>
            {
                list.Add(record);
                return list;
            });

        return Task.CompletedTask;
    }

    public Task<TenantBrandingProfileRecord?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Active);

    public Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Default);

    public Task<TenantBrandingProfileRecord?> TryGetDraftAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Draft);

    public Task ReplaceDraftAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.BrandingStatus != BrandingProfileStatus.Draft)
            throw new InvalidOperationException("ReplaceDraftAsync requires a Draft profile.");

        List<TenantBrandingProfileRecord> profiles = _profilesByTenant.GetOrAdd(record.TenantId, _ => []);
        profiles.RemoveAll(p => p.BrandingStatus == BrandingProfileStatus.Draft);
        profiles.Add(record);

        return Task.CompletedTask;
    }

    public Task UpdateStatusForTenantAsync(
        Guid tenantId,
        BrandingProfileStatus fromStatus,
        BrandingProfileStatus toStatus,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.CompletedTask;

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        for (int i = 0; i < profiles.Count; i++)
        {
            TenantBrandingProfileRecord profile = profiles[i];

            if (profile.BrandingStatus != fromStatus)
                continue;

            profiles[i] = CloneProfile(profile, toStatus, utcNow, updatedBy);
        }

        return Task.CompletedTask;
    }

    public Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult(0);

        int count = profiles.Count(p => p.BrandingStatus == BrandingProfileStatus.Active);
        return Task.FromResult(count);
    }

    private Task<TenantBrandingProfileRecord?> TryGetByStatusAsync(Guid tenantId, BrandingProfileStatus status)
    {
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult<TenantBrandingProfileRecord?>(null);

        TenantBrandingProfileRecord? match = profiles
            .Where(p => p.BrandingStatus == status)
            .OrderByDescending(p => p.Version)
            .FirstOrDefault();

        return Task.FromResult(match);
    }

    private static TenantBrandingProfileRecord CloneProfile(
        TenantBrandingProfileRecord source,
        BrandingProfileStatus status,
        DateTime updatedUtc,
        string updatedBy) =>
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
