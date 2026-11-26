using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

public sealed class SqlServerDisposableCatalogConnectionTests
{
    [Theory]
    [InlineData("master")]
    [InlineData("CustomerTestData")]
    [Trait("Category", "Unit")]
    public void Catalog_builder_replaces_caller_catalog_and_never_attaches_caller_database(string configuredCatalog)
    {
        SqlConnectionStringBuilder template = new()
        {
            DataSource = "sql-test-host,1433",
            InitialCatalog = configuredCatalog,
            AttachDBFilename = "/example/caller-database.mdf",
            ApplicationIntent = ApplicationIntent.ReadOnly,
            IntegratedSecurity = true,
        };

        SqlConnectionStringBuilder first = SqlServerDisposablePersistenceFixture.BuildOwnedCatalogConnection(template.ConnectionString);
        SqlConnectionStringBuilder second = SqlServerDisposablePersistenceFixture.BuildOwnedCatalogConnection(template.ConnectionString);

        first.InitialCatalog.Should().StartWith("ArchLucidPersistenceTest_").And.NotBe(configuredCatalog);
        first.InitialCatalog.Should().NotBe(second.InitialCatalog);
        first.AttachDBFilename.Should().BeEmpty();
        first.DataSource.Should().Be(template.DataSource);
        first.IntegratedSecurity.Should().BeTrue();
        first.ApplicationIntent.Should().Be(ApplicationIntent.ReadWrite);
        first.Pooling.Should().BeFalse();
    }
}

[Collection(nameof(SqlServerDisposablePersistenceCollection))]
public sealed class SqlServerDisposablePersistenceFixtureTests(SqlServerDisposablePersistenceFixture other)
{
    [SkippableFact]
    [Trait("Category", "SqlServerContainer")]
    [Trait("Category", SqlServerDisposablePersistenceFixture.Category)]
    public async Task Owned_catalog_is_migrated_and_disposed_without_dropping_another_fixtures_catalog()
    {
        Skip.IfNot(other.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionStringBuilder otherBuilder = new(other.ConnectionString);
        SqlServerDisposablePersistenceFixture owned = new();
        string catalog;
        try
        {
            await owned.InitializeAsync();
            owned.IsSqlServerAvailable.Should().BeTrue();
            await using SqlConnection sql = new(owned.ConnectionString);
            await sql.OpenAsync();
            catalog = sql.Database;
            catalog.Should().NotBe(otherBuilder.InitialCatalog);
            (await sql.ExecuteScalarAsync<int?>("SELECT OBJECT_ID(N'dbo.Runs');")).Should().NotBeNull();
        }
        finally
        {
            await owned.DisposeAsync();
        }

        otherBuilder.InitialCatalog = "master";
        await using SqlConnection admin = new(otherBuilder.ConnectionString);
        await admin.OpenAsync();
        (await admin.ExecuteScalarAsync<int?>("SELECT DB_ID(@name);", new { name = catalog })).Should().BeNull();
        await using SqlConnection surviving = new(other.ConnectionString);
        await surviving.OpenAsync();
        surviving.Database.Should().Be(new SqlConnectionStringBuilder(other.ConnectionString).InitialCatalog);
    }
}
