using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class SqlTenantCatalogConnectionStringFactoryTests
{
    [Fact]
    public void FromTemplate_sets_initial_catalog_and_retry_policy()
    {
        const string template =
            "Server=tcp:localhost;Database=ArchLucid;Encrypt=True;TrustServerCertificate=True";

        string connectionString = SqlTenantCatalogConnectionStringFactory.FromTemplate(template, "tenant-catalog");

        SqlConnectionStringBuilder builder = new(connectionString);

        builder.InitialCatalog.Should().Be("tenant-catalog");
        builder.ConnectRetryCount.Should().Be(3);
        builder.ConnectRetryInterval.Should().Be(10);
        builder.Encrypt.Should().Be(SqlConnectionEncryptOption.Mandatory);
    }

    [Fact]
    public void FromTemplate_rejects_blank_inputs()
    {
        Action blankTemplate = () => SqlTenantCatalogConnectionStringFactory.FromTemplate("  ", "db");
        Action blankCatalog = () => SqlTenantCatalogConnectionStringFactory.FromTemplate(
            "Server=tcp:localhost;Database=ArchLucid;Encrypt=True;TrustServerCertificate=True",
            " ");

        blankTemplate.Should().Throw<ArgumentException>();
        blankCatalog.Should().Throw<ArgumentException>();
    }
}
