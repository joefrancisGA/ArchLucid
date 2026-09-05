using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlTenantBrandingProfileRepository(ISqlConnectionFactory connectionFactory)
    : ITenantBrandingProfileRepository
{
    public async Task InsertAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.TenantBrandingProfiles
                           (
                               BrandingProfileId, TenantId, CompanyDisplayName, CompanyLegalName, ShortDisplayName,
                               LogoPrimaryAssetId, LogoSecondaryAssetId, LogoSquareAssetId, LogoFaviconAssetId,
                               LogoDarkAssetId, LogoLightAssetId, LogoReportCoverAssetId, LogoMonoAssetId,
                               PrimaryColor, SecondaryColor, AccentColor, BackgroundColor, ForegroundColor,
                               TypographyJson, Tagline, WebsiteUrl, SupportUrl, BrandingStatus, Version,
                               CreatedUtc, UpdatedUtc, CreatedBy, UpdatedBy, CoBrandingEnabled
                           )
                           VALUES
                           (
                               @BrandingProfileId, @TenantId, @CompanyDisplayName, @CompanyLegalName, @ShortDisplayName,
                               @LogoPrimaryAssetId, @LogoSecondaryAssetId, @LogoSquareAssetId, @LogoFaviconAssetId,
                               @LogoDarkAssetId, @LogoLightAssetId, @LogoReportCoverAssetId, @LogoMonoAssetId,
                               @PrimaryColor, @SecondaryColor, @AccentColor, @BackgroundColor, @ForegroundColor,
                               @TypographyJson, @Tagline, @WebsiteUrl, @SupportUrl, @BrandingStatus, @Version,
                               @CreatedUtc, @UpdatedUtc, @CreatedBy, @UpdatedBy, @CoBrandingEnabled
                           );
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        try
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        record.BrandingProfileId,
                        record.TenantId,
                        record.CompanyDisplayName,
                        record.CompanyLegalName,
                        record.ShortDisplayName,
                        record.LogoPrimaryAssetId,
                        record.LogoSecondaryAssetId,
                        record.LogoSquareAssetId,
                        record.LogoFaviconAssetId,
                        record.LogoDarkAssetId,
                        record.LogoLightAssetId,
                        record.LogoReportCoverAssetId,
                        record.LogoMonoAssetId,
                        record.PrimaryColor,
                        record.SecondaryColor,
                        record.AccentColor,
                        record.BackgroundColor,
                        record.ForegroundColor,
                        record.TypographyJson,
                        record.Tagline,
                        record.WebsiteUrl,
                        record.SupportUrl,
                        BrandingStatus = (int)record.BrandingStatus,
                        record.Version,
                        record.CreatedUtc,
                        record.UpdatedUtc,
                        record.CreatedBy,
                        record.UpdatedBy,
                        record.CoBrandingEnabled,
                    },
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            throw new InvalidOperationException("Only one Active branding profile is allowed per tenant.", ex);
        }
    }

    public async Task<TenantBrandingProfileRecord?> TryGetActiveAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => await TryGetByStatusAsync(tenantId, BrandingProfileStatus.Active, cancellationToken);

    public async Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => await TryGetByStatusAsync(tenantId, BrandingProfileStatus.Default, cancellationToken);

    public async Task<TenantBrandingProfileRecord?> TryGetDraftAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => await TryGetByStatusAsync(tenantId, BrandingProfileStatus.Draft, cancellationToken);

    public async Task ReplaceDraftAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.BrandingStatus != BrandingProfileStatus.Draft)
            throw new InvalidOperationException("ReplaceDraftAsync requires a Draft profile.");

        const string deleteSql = """
                                 DELETE FROM dbo.TenantBrandingProfiles
                                 WHERE TenantId = @TenantId AND BrandingStatus = @BrandingStatus;
                                 """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new { record.TenantId, BrandingStatus = (int)BrandingProfileStatus.Draft },
                cancellationToken: cancellationToken));

        await InsertAsync(record, cancellationToken);
    }

    public async Task UpdateStatusForTenantAsync(
        Guid tenantId,
        BrandingProfileStatus fromStatus,
        BrandingProfileStatus toStatus,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.TenantBrandingProfiles
                           SET BrandingStatus = @ToStatus,
                               UpdatedUtc = @UpdatedUtc,
                               UpdatedBy = @UpdatedBy
                           WHERE TenantId = @TenantId AND BrandingStatus = @FromStatus;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    FromStatus = (int)fromStatus,
                    ToStatus = (int)toStatus,
                    UpdatedUtc = TimeProvider.System.UtcNowDateTime(),
                    UpdatedBy = updatedBy,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.TenantBrandingProfiles
                           WHERE TenantId = @TenantId AND BrandingStatus = @BrandingStatus;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, BrandingStatus = (int)BrandingProfileStatus.Active },
                cancellationToken: cancellationToken));
    }

    private async Task<TenantBrandingProfileRecord?> TryGetByStatusAsync(
        Guid tenantId,
        BrandingProfileStatus status,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP (1)
                               BrandingProfileId, TenantId, CompanyDisplayName, CompanyLegalName, ShortDisplayName,
                               LogoPrimaryAssetId, LogoSecondaryAssetId, LogoSquareAssetId, LogoFaviconAssetId,
                               LogoDarkAssetId, LogoLightAssetId, LogoReportCoverAssetId, LogoMonoAssetId,
                               PrimaryColor, SecondaryColor, AccentColor, BackgroundColor, ForegroundColor,
                               TypographyJson, Tagline, WebsiteUrl, SupportUrl, BrandingStatus, Version,
                               CreatedUtc, UpdatedUtc, CreatedBy, UpdatedBy, CoBrandingEnabled
                           FROM dbo.TenantBrandingProfiles
                           WHERE TenantId = @TenantId AND BrandingStatus = @BrandingStatus
                           ORDER BY Version DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, BrandingStatus = (int)status },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    private static TenantBrandingProfileRecord Map(Row row) =>
        new()
        {
            BrandingProfileId = row.BrandingProfileId,
            TenantId = row.TenantId,
            CompanyDisplayName = row.CompanyDisplayName,
            CompanyLegalName = row.CompanyLegalName,
            ShortDisplayName = row.ShortDisplayName,
            LogoPrimaryAssetId = row.LogoPrimaryAssetId,
            LogoSecondaryAssetId = row.LogoSecondaryAssetId,
            LogoSquareAssetId = row.LogoSquareAssetId,
            LogoFaviconAssetId = row.LogoFaviconAssetId,
            LogoDarkAssetId = row.LogoDarkAssetId,
            LogoLightAssetId = row.LogoLightAssetId,
            LogoReportCoverAssetId = row.LogoReportCoverAssetId,
            LogoMonoAssetId = row.LogoMonoAssetId,
            PrimaryColor = row.PrimaryColor,
            SecondaryColor = row.SecondaryColor,
            AccentColor = row.AccentColor,
            BackgroundColor = row.BackgroundColor,
            ForegroundColor = row.ForegroundColor,
            TypographyJson = row.TypographyJson,
            Tagline = row.Tagline,
            WebsiteUrl = row.WebsiteUrl,
            SupportUrl = row.SupportUrl,
            BrandingStatus = (BrandingProfileStatus)row.BrandingStatus,
            Version = row.Version,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            CreatedBy = row.CreatedBy,
            UpdatedBy = row.UpdatedBy,
            CoBrandingEnabled = row.CoBrandingEnabled,
        };

    private sealed class Row
    {
        public Guid BrandingProfileId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string? CompanyDisplayName
        {
            get;
            init;
        }

        public string? CompanyLegalName
        {
            get;
            init;
        }

        public string? ShortDisplayName
        {
            get;
            init;
        }

        public Guid? LogoPrimaryAssetId
        {
            get;
            init;
        }

        public Guid? LogoSecondaryAssetId
        {
            get;
            init;
        }

        public Guid? LogoSquareAssetId
        {
            get;
            init;
        }

        public Guid? LogoFaviconAssetId
        {
            get;
            init;
        }

        public Guid? LogoDarkAssetId
        {
            get;
            init;
        }

        public Guid? LogoLightAssetId
        {
            get;
            init;
        }

        public Guid? LogoReportCoverAssetId
        {
            get;
            init;
        }

        public Guid? LogoMonoAssetId
        {
            get;
            init;
        }

        public string? PrimaryColor
        {
            get;
            init;
        }

        public string? SecondaryColor
        {
            get;
            init;
        }

        public string? AccentColor
        {
            get;
            init;
        }

        public string? BackgroundColor
        {
            get;
            init;
        }

        public string? ForegroundColor
        {
            get;
            init;
        }

        public string? TypographyJson
        {
            get;
            init;
        }

        public string? Tagline
        {
            get;
            init;
        }

        public string? WebsiteUrl
        {
            get;
            init;
        }

        public string? SupportUrl
        {
            get;
            init;
        }

        public int BrandingStatus
        {
            get;
            init;
        }

        public int Version
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public string? CreatedBy
        {
            get;
            init;
        }

        public string? UpdatedBy
        {
            get;
            init;
        }

        public bool CoBrandingEnabled
        {
            get;
            init;
        }
    }
}
