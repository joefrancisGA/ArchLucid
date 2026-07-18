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

    [Fact]
    public void Greenfield_pins_system_catalog_and_single_catalog_topology()
    {
        string? originalArchLucid = Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid");
        string? originalSystem = Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucidSystem");
        string? originalTopology = Environment.GetEnvironmentVariable("ArchLucid__SqlTopology__Mode");

        try
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", "Server=prev;Database=Prev;");
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucidSystem", "Server=system;Database=System;");
            Environment.SetEnvironmentVariable("ArchLucid__SqlTopology__Mode", "SystemWithPerTenantCatalogs");

            using (IntegrationTestSqlCatalogEnvironment scope = new(
                       "Server=test;Database=Ephemeral;",
                       pinSystemCatalogToSameDatabase: true,
                       pinSingleCatalogTopology: true))
            {
                Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
                    .Should()
                    .Be("Server=test;Database=Ephemeral;");
                Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucidSystem")
                    .Should()
                    .Be("Server=test;Database=Ephemeral;");
                Environment.GetEnvironmentVariable("ArchLucid__SqlTopology__Mode")
                    .Should()
                    .Be("SingleCatalog");
            }

            Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
                .Should()
                .Be("Server=prev;Database=Prev;");
            Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucidSystem")
                .Should()
                .Be("Server=system;Database=System;");
            Environment.GetEnvironmentVariable("ArchLucid__SqlTopology__Mode")
                .Should()
                .Be("SystemWithPerTenantCatalogs");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", originalArchLucid);
            Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucidSystem", originalSystem);
            Environment.SetEnvironmentVariable("ArchLucid__SqlTopology__Mode", originalTopology);
        }
    }
}
