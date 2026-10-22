using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Marketing;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Marketing;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlTenantMarketingAttributionRepository(ISqlConnectionFactory connectionFactory)
    : ITenantMarketingAttributionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<bool> TryInsertFirstTouchAsync(
        Guid tenantId,
        MarketingAttributionSnapshot snapshot,
        string coarseMedium,
        string coarsePlatform,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(coarseMedium);
        ArgumentException.ThrowIfNullOrWhiteSpace(coarsePlatform);

        const string sql = """
                           IF NOT EXISTS (SELECT 1 FROM dbo.TenantMarketingAttribution WHERE TenantId = @TenantId)
                           BEGIN
                               INSERT INTO dbo.TenantMarketingAttribution
                                   (TenantId, CapturedUtc, UtmSource, UtmMedium, UtmCampaign, UtmContent, CoarseMedium, CoarsePlatform)
                               VALUES
                                   (@TenantId, @CapturedUtc, @UtmSource, @UtmMedium, @UtmCampaign, @UtmContent, @CoarseMedium, @CoarsePlatform);
                               SELECT CAST(1 AS bit);
                           END
                           ELSE
                               SELECT CAST(0 AS bit);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                CapturedUtc = snapshot.CapturedUtc.UtcDateTime,
                UtmSource = TrimOrNull(snapshot.UtmSource),
                UtmMedium = TrimOrNull(snapshot.UtmMedium),
                UtmCampaign = TrimOrNull(snapshot.UtmCampaign),
                UtmContent = TrimOrNull(snapshot.UtmContent),
                CoarseMedium = coarseMedium,
                CoarsePlatform = coarsePlatform,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<bool>(cmd).ConfigureAwait(false);
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
