using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class IntegrationTestSqlCatalogEnvironmentTests
{
    [Fact]
    public void Constructor_sets_required_value_and_dispose_restores_previous()
    {
        string? original = Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid");

        try
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", "Server=prev;Database=Prev;");

            using (IntegrationTestSqlCatalogEnvironment scope = new("Server=test;Database=Ephemeral;"))
            {
                Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
                    .Should()
                    .Be("Server=test;Database=Ephemeral;");
            }

            Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
                .Should()
                .Be("Server=prev;Database=Prev;");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", original);
        }
    }

    [Fact]
    public void Dispose_clears_when_no_previous_value()
    {
        string? original = Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid");

        try
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", null);

            using (IntegrationTestSqlCatalogEnvironment scope = new("Server=test;Database=Ephemeral;"))
            {
                Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
                    .Should()
                    .Be("Server=test;Database=Ephemeral;");
            }

            Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid").Should().BeNull();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", original);
        }
    }
}
