using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Worker.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WorkerConfigurationTests
{
    [Fact]
    public void CollectErrors_rejects_system_with_per_tenant_catalogs_without_archlucid_system_connection()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] = "Server=localhost;Database=ArchLucidTenantTemplate;Encrypt=True;TrustServerCertificate=True",
            ["ArchLucid:SqlTopology:Mode"] = "SystemWithPerTenantCatalogs",
            ["ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate"] =
                "Server=localhost;Database={DatabaseName};Encrypt=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Authority"] = "https://mock.example.com/",
            ["ArchLucidAuth:Audience"] = "mock",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> environment = new();
        environment.Setup(e => e.EnvironmentName).Returns("Development");

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, environment.Object);

        errors.Should()
            .Contain(
                e => e.Contains("ConnectionStrings:ArchLucidSystem", StringComparison.Ordinal)
                    && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal),
                "the worker should fail fast when per-tenant topology is enabled without a control-plane catalog.");
    }
}
