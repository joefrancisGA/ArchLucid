using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;
using Polly;

namespace ArchLucid.Persistence.Tests.Tenancy;

/// <summary>Exercises the actual SQL read path for legacy stored values.</summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SqlTenantSettingsLegacyReadIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task TryGetAsync_normalizes_legacy_values_and_missing_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        SqlTenantSettingsRepository sut = new(factory, new SqlResilientOperationExecutor(ResiliencePipeline.Empty));
        Guid tenantId = Guid.NewGuid();
        string key = "test-aspects-" + Guid.NewGuid().ToString("N");
        await tenants.InsertTenantAsync(tenantId, "Legacy settings fixture", key,
            TenantTier.Standard, null, TenantDataRegions.Default, CancellationToken.None);

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        try
        {
            (await sut.TryGetAsync(tenantId, key, CancellationToken.None)).Should().BeNull();
            await connection.ExecuteAsync(
                "INSERT INTO dbo.TenantSettings (TenantId, SettingKey, SettingValue) VALUES (@TenantId, @Key, @Value);",
                new { TenantId = tenantId, Key = key, Value = "" });
            (await sut.TryGetAsync(tenantId, key, CancellationToken.None)).Should().BeNull();

            foreach (string value in new[] { "   ", "  enabled  " })
            {
                await connection.ExecuteAsync(
                    "UPDATE dbo.TenantSettings SET SettingValue = @Value WHERE TenantId = @TenantId AND SettingKey = @Key;",
                    new { TenantId = tenantId, Key = key, Value = value });
                string? actual = await sut.TryGetAsync(tenantId, key, CancellationToken.None);
                if (value == "   ")
                    actual.Should().BeNull();
                else
                    actual.Should().Be("enabled");
            }
        }
        finally
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.TenantSettings WHERE TenantId = @TenantId AND SettingKey = @Key;",
                new { TenantId = tenantId, Key = key });
            await connection.ExecuteAsync("DELETE FROM dbo.Tenants WHERE Id = @TenantId;", new { TenantId = tenantId });
        }
    }
}
