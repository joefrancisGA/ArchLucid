using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
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
