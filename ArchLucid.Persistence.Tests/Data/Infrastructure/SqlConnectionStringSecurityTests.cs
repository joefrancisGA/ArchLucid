using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class SqlConnectionStringSecurityTests
{
    [SkippableFact]
    public void EnsureSqlClientEncryptMandatory_TrimsAndSetsEncryptMandatory()
    {
        const string input = " Server=localhost; Database=Db; Integrated Security=true; TrustServerCertificate=true; ";

        string actual = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(input);

        SqlConnectionStringBuilder b = new(actual);
        b.Encrypt.Should().Be(SqlConnectionEncryptOption.Mandatory);
        b.DataSource.Should().Be("localhost");
    }

    [SkippableFact]
    public void EnsureSqlClientEncryptMandatory_Throws_WhenNullOrWhiteSpace()
    {
        Action actNull = () => SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(null!);
        Action actEmpty = () => SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory("   ");

        actNull.Should().Throw<ArgumentException>().WithParameterName("connectionString");
        actEmpty.Should().Throw<ArgumentException>().WithParameterName("connectionString");
    }

    [SkippableFact]
    public void EnsureSqlClientEncryptMandatory_WhenEnforceTrust_ClearsTrustServerCertificate()
    {
        const string input = "Server=localhost;Database=Db;TrustServerCertificate=True;";

        string actual = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(input, enforceServerCertificateTrust: true);

        SqlConnectionStringBuilder builder = new(actual);
        builder.TrustServerCertificate.Should().BeFalse();
    }

    [SkippableFact]
    public void EnsureSqlClientEncryptMandatory_WhenNotEnforcingTrust_PreservesTrustServerCertificate()
    {
        const string input = "Server=localhost;Database=Db;TrustServerCertificate=True;";

        string actual = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(input, enforceServerCertificateTrust: false);

        SqlConnectionStringBuilder builder = new(actual);
        builder.TrustServerCertificate.Should().BeTrue();
    }
}
