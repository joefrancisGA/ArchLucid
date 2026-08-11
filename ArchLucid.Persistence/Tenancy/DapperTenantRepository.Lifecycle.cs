using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{

    /// <inheritdoc />
    public async Task UpdateBaselineAsync(
        Guid tenantId,
        decimal? manualPrepHoursPerReview,
        int? peoplePerReview,
        DateTimeOffset? capturedUtc,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET BaselineManualPrepHoursPerReview = @ManualPrepHours,
                               BaselinePeoplePerReview = @PeoplePerReview,
                               BaselineManualPrepCapturedUtc = @CapturedUtc
                           WHERE Id = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    ManualPrepHours = manualPrepHoursPerReview,
                    PeoplePerReview = peoplePerReview,
                    CapturedUtc = capturedUtc
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<bool> UpdateEntraTenantIdAsync(Guid tenantId, Guid entraTenantId, CancellationToken ct)
    {
        TenantRecord? tenant = await GetByIdAsync(tenantId, ct).ConfigureAwait(false);

        if (tenant is null)
            return false;

        if (tenant.EntraTenantId is { } existing && existing != entraTenantId)
            return false;

        if (tenant.EntraTenantId == entraTenantId)
            return true;

        TenantRecord? holder = await GetByEntraTenantIdAsync(entraTenantId, ct).ConfigureAwait(false);

        if (holder is not null && holder.Id != tenantId)
            return false;

        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET EntraTenantId = @EntraTenantId
                           WHERE Id = @Id
                             AND (EntraTenantId IS NULL OR EntraTenantId = @EntraTenantId);
                           """;

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                Id = tenantId,
                EntraTenantId = entraTenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return rows == 1;
    }


    public async Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null)
    {
        // Control-plane registry writes always target the system catalog; never the scoped tenant-plane factory.
        await using SqlConnection connection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        string normalizedSlug = slug.Trim().ToLowerInvariant();

        string sql = enterpriseScimSeatsLimit is null
            ? """
              INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId, DataRegion)
              VALUES (@Id, @Name, @Slug, @Tier, @EntraTenantId, @DataRegion);
              """
            : """
              INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId, EnterpriseSeatsLimit, DataRegion)
              VALUES (@Id, @Name, @Slug, @Tier, @EntraTenantId, @EnterpriseSeatsLimit, @DataRegion);
              """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    Name = name,
                    Slug = normalizedSlug,
                    Tier = TenantTierSql.ToTierString(tier),
                    EntraTenantId = entraTenantId,
                    EnterpriseSeatsLimit = enterpriseScimSeatsLimit,
                    DataRegion = dataRegion
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    public async Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET SuspendedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id;
                           """;

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            await catalog.ExecuteAsync(new CommandDefinition(sql, new
            {
                Id = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenant = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        await tenant.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET SuspendedUtc = NULL
                           WHERE Id = @Id
                             AND OffboardedUtc IS NULL;
                           """;

        int affected = 0;

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            affected = await catalog.ExecuteAsync(new CommandDefinition(sql, new
            {
                Id = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenant = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int tenantAffected = await tenant.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);

        return affected > 0 || tenantAffected > 0;
    }
}
