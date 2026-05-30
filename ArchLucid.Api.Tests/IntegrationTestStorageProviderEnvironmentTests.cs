using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class IntegrationTestStorageProviderEnvironmentTests
{
    [Fact]
    public void Constructor_sets_required_value_and_dispose_restores_previous()
    {
        string? original = Environment.GetEnvironmentVariable("ArchLucid__StorageProvider");

        try
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", "Blob");

            using (IntegrationTestStorageProviderEnvironment scope = new("InMemory"))
            {
                Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().Be("InMemory");
            }

            Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().Be("Blob");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", original);
        }
    }

    [Fact]
    public void Dispose_clears_when_no_previous_value()
    {
        string? original = Environment.GetEnvironmentVariable("ArchLucid__StorageProvider");

        try
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", null);

            using (IntegrationTestStorageProviderEnvironment scope = new("Sql"))
            {
                Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().Be("Sql");
            }

            Environment.GetEnvironmentVariable("ArchLucid__StorageProvider").Should().BeNull();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ArchLucid__StorageProvider", original);
        }
    }
}
