using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class GreenfieldSqlIntegrationTestEnvironmentOverridesTests
{
    [Fact]
    public void Apply_and_Clear_are_reference_counted()
    {
        string? original = Environment.GetEnvironmentVariable("ArchLucid__StorageProvider");

        try
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", null);

            GreenfieldSqlIntegrationTestEnvironmentOverrides.Apply();

            Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().Be("Sql");

            GreenfieldSqlIntegrationTestEnvironmentOverrides.Apply();
            GreenfieldSqlIntegrationTestEnvironmentOverrides.Clear();

            Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().Be("Sql");

            GreenfieldSqlIntegrationTestEnvironmentOverrides.Clear();

            Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().BeNull();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", original);
        }
    }
}
