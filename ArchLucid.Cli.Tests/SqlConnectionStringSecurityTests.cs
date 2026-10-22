using ArchLucid.Cli.Diagnostics;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlConnectionStringSecurityTests
{
    [Fact]
    public void EnsureSqlClientEncryptMandatory_sets_encrypt_mandatory()
    {
        string normalized = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
            "Server=localhost;Database=ArchLucid;User ID=app;Password=secret;TrustServerCertificate=True");

        SqlConnectionStringBuilder builder = new(normalized);

        builder.Encrypt.Should().Be(SqlConnectionEncryptOption.Mandatory);
    }

    [Fact]
    public void EnsureSqlClientEncryptMandatory_throws_when_connection_string_blank()
    {
        Action act = () => SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory("   ");

        act.Should().Throw<ArgumentException>();
    }
}
