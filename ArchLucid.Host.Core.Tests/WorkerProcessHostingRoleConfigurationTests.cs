using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WorkerProcessHostingRoleConfigurationTests
{
    [Fact]
    public void Apply_defaults_missing_hosting_role_to_worker()
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder();

        WorkerProcessHostingRoleConfiguration.Apply(builder);

        HostingRoleResolver.Resolve(builder.Configuration).Should().Be(ArchLucidHostingRole.Worker);
    }

    [Fact]
    public void Apply_rejects_non_worker_hosting_role()
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder();
        builder.Configuration.AddInMemoryCollection(
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
            {
                ["Hosting:Role"] = "Api",
            });

        Action act = () => WorkerProcessHostingRoleConfiguration.Apply(builder);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*Hosting:Role=Worker*");
    }

    [Fact]
    public void ValidateOrThrow_enforces_container_job_offload_manifest_when_role_was_missing()
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder();
        builder.Environment.EnvironmentName = Environments.Production;
        builder.Configuration.AddInMemoryCollection(
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
            {
                ["ArchLucidAuth:Authority"] = "https://mock.example.com/",
                ["ArchLucidAuth:Audience"] = "mock",
                ["ArchLucid:StorageProvider"] = "Sql",
                ["ConnectionStrings:ArchLucid"] =
                    "Server=localhost;Database=ArchLucid;Encrypt=True;TrustServerCertificate=True",
                ["Jobs:OffloadedToContainerJobs:0"] = "retrieval-indexer",
                ["Jobs:DeployedContainerJobNames"] = "other-job",
            });

        WorkerProcessHostingRoleConfiguration.Apply(builder);

        Action act = () => WorkerProcessHostingRoleConfiguration.ValidateOrThrow(builder);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*ArchLucid configuration is invalid*")
            .WithMessage("*retrieval-indexer*");
    }

    [Fact]
    public void CollectErrors_skips_container_offload_check_when_hosting_role_is_combined()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Hosting:Role"] = "Combined",
            ["ArchLucidAuth:Authority"] = "https://mock.example.com/",
            ["ArchLucidAuth:Audience"] = "mock",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=localhost;Database=ArchLucid;Encrypt=True;TrustServerCertificate=True",
            ["Jobs:OffloadedToContainerJobs:0"] = "retrieval-indexer",
            ["Jobs:DeployedContainerJobNames"] = "other-job",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, environment);

        errors.Should().NotContain(e => e.Contains("retrieval-indexer", StringComparison.Ordinal));
    }

    private sealed class TestHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Worker.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();

        public string WebRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }
}
