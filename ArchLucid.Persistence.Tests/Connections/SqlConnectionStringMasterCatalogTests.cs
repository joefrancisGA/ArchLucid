using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlConnectionStringMasterCatalogTests
{
    [Fact]
    public void RedirectToMaster_ReplacesInitialCatalog()
    {
        const string connectionString =
            "Server=localhost;Database=ArchLucid;User Id=sa;Password=x;TrustServerCertificate=True;";

        string master = SqlConnectionStringMasterCatalog.RedirectToMaster(connectionString);

        SqlConnectionStringBuilder builder = new(master);
        builder.InitialCatalog.Should().Be(SqlConnectionStringMasterCatalog.MasterCatalogName);
    }

    [Fact]
    public void ReadInitialCatalog_ReturnsCatalogName()
    {
        const string connectionString =
            "Server=localhost;Database=ArchLucid;User Id=sa;Password=x;TrustServerCertificate=True;";

        SqlConnectionStringMasterCatalog.ReadInitialCatalog(connectionString).Should().Be("ArchLucid");
    }

    [Fact]
    public void ReadInitialCatalog_Throws_WhenCatalogMissing()
    {
        Action act = () => SqlConnectionStringMasterCatalog.ReadInitialCatalog("Server=localhost;");

        act.Should().Throw<InvalidOperationException>().WithMessage("*Initial Catalog*");
    }
}
