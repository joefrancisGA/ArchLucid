using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration hosts using <see cref="ArchLucid.Api.Tests.ArchLucidApiFactory" /> resolve commercial tier via
///     <see cref="ITenantRepository" /> (in-memory registry or SQL-backed <c>dbo.Tenants</c>).
/// </summary>
internal static class CommercialTierIntegrationTestTenant
{
    public static async Task SetDefaultScopedTenantTierAsync(
        ArchLucidApiFactory factory,
        TenantTier tier,
        CancellationToken cancellationToken = default)
    {
        using IServiceScope scope = factory.Services.CreateScope();

        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        if (tenants is InMemoryTenantRepository inMemory)
        {
            await inMemory.SetCommercialTierForIntegrationTestsAsync(ScopeIds.DefaultTenant, tier, cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        await SetSqlTenantCommercialTierAsync(factory.SqlConnectionString, ScopeIds.DefaultTenant, tier, cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task SetSqlTenantCommercialTierAsync(
        string connectionString,
        Guid tenantId,
        TenantTier tier,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        string tierValue = tier switch
        {
            TenantTier.Free => "Free",
            TenantTier.Standard => "Standard",
            TenantTier.Enterprise => "Enterprise",
            _ => throw new ArgumentOutOfRangeException(nameof(tier), tier, null)
        };

        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using SqlCommand command = connection.CreateCommand();
        command.CommandText = """
            UPDATE dbo.Tenants
            SET Tier = @Tier
            WHERE Id = @TenantId;
            """;
        command.Parameters.AddWithValue("@Tier", tierValue);
        command.Parameters.AddWithValue("@TenantId", tenantId);

        int rows = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        if (rows == 0)
        {
            throw new InvalidOperationException(
                $"Tenant '{tenantId:D}' was not found in SQL; ensure integration migrations seeded default scope.");
        }
    }
}
