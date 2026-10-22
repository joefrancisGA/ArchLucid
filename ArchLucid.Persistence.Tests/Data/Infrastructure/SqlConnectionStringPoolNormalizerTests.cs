using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class SqlConnectionStringPoolNormalizerTests
{
    [SkippableFact]
    public void Apply_returns_trimmed_string_when_pool_options_null()
    {
        const string connectionString = " Server=localhost;Database=ArchLucid; ";

        string normalized = SqlConnectionStringPoolNormalizer.Apply(connectionString, null);

        normalized.Should().Be("Server=localhost;Database=ArchLucid;");
    }

    [SkippableFact]
    public void Apply_sets_max_pool_size_and_mars_when_configured()
    {
        const string connectionString =
            "Server=localhost;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True";

        SqlConnectionPoolOptions options = new()
        {
            MaxPoolSize = 200,
            MultipleActiveResultSets = true,
        };

        string normalized = SqlConnectionStringPoolNormalizer.Apply(connectionString, options);

        normalized.Should().Contain("Max Pool Size=200");
        normalized.Should().Contain("Multiple Active Result Sets=True");
    }

    [SkippableFact]
    public void Apply_throws_when_max_pool_size_below_one()
    {
        SqlConnectionPoolOptions options = new() { MaxPoolSize = 0 };

        Action act = () =>
            SqlConnectionStringPoolNormalizer.Apply("Server=localhost;Database=ArchLucid;", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*MaxPoolSize*");
    }
}
