using ArchLucid.Persistence.MigrateVerify;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.MigrateVerify;

[Trait("Category", "Unit")]
/// <summary>
///     Process env is mutated per-instance to avoid flaky parallel workers when multiple tests toggle
///     <see cref="MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName" />.
/// </summary>
public sealed class TryReadConnectionStringTests : IDisposable
{
    private readonly string? _savedConnectionStringEnvironmentValue;

    public TryReadConnectionStringTests()
    {
        _savedConnectionStringEnvironmentValue =
            Environment.GetEnvironmentVariable(MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName);

        Environment.SetEnvironmentVariable(MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName, null);
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable(
            MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName,
            _savedConnectionStringEnvironmentValue);
    }

    [Fact]
    public void When_environment_and_arguments_absent_returns_false()
    {
        bool ok =
            MigrateVerifyConnectionStringReader.TryReadConnectionString([], out string cs, out string err);

        ok.Should().BeFalse();
        cs.Should().BeEmpty();
        err.Should().Contain(MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName);
    }

    [Fact]
    public void When_argument_has_initial_catalog_returns_true()
    {
        const string expected = "Server=127.0.0.1,1433;User Id=sa;Password=test;Encrypt=True;TrustServerCertificate=True;"
                                + "Initial Catalog=ArchLucidMigrateVerify";

        bool ok = MigrateVerifyConnectionStringReader.TryReadConnectionString([expected], out string cs, out string err);

        ok.Should().BeTrue();
        err.Should().BeEmpty();
        cs.Should().Be(expected);
    }

    [Fact]
    public void When_connection_string_missing_initial_catalog_returns_false()
    {
        const string missingCatalog = "Server=127.0.0.1,1433;User Id=sa;Password=test;Encrypt=True;TrustServerCertificate=True";

        bool ok = MigrateVerifyConnectionStringReader.TryReadConnectionString([missingCatalog], out string cs, out string err);

        ok.Should().BeFalse();
        cs.Should().BeEmpty();
        err.Should().Be("Initial Catalog is required.");
    }

    [Fact]
    public void When_environment_provides_initial_catalog_even_if_arguments_empty_returns_true()
    {
        const string expected = "Server=127.0.0.1,1433;User Id=sa;Password=test;Encrypt=True;TrustServerCertificate=True;"
                                + "Initial Catalog=FromEnv";

        Environment.SetEnvironmentVariable(
            MigrateVerifyConnectionStringReader.ConnectionStringEnvironmentVariableName,
            expected);

        bool ok = MigrateVerifyConnectionStringReader.TryReadConnectionString([], out string cs, out string err);

        ok.Should().BeTrue();
        err.Should().BeEmpty();
        cs.Should().Be(expected);
    }
}
