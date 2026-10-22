using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlFailoverRulesTests
{
    [Fact]
    public void Collect_skips_when_not_production()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = "Server=tcp:primary.database.windows.net;",
            ["SqlServer:FailoverGroupListenerFqdn"] = "listener.database.windows.net",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Development };
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        SqlFailoverRules.Collect(configuration, environment, options, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Collect_requires_listener_fqdn_in_primary_connection_string()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = "Server=tcp:primary.database.windows.net;",
            ["SqlServer:FailoverGroupListenerFqdn"] = "listener.database.windows.net",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        SqlFailoverRules.Collect(configuration, environment, options, errors);

        errors.Should().ContainSingle(e => e.Contains("listener.database.windows.net", StringComparison.Ordinal));
    }

    [Fact]
    public void Collect_passes_when_connection_string_contains_listener_fqdn()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = "Server=tcp:listener.database.windows.net;",
            ["SqlServer:FailoverGroupListenerFqdn"] = "listener.database.windows.net",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        SqlFailoverRules.Collect(configuration, environment, options, errors);

        errors.Should().BeEmpty();
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();

        public string WebRootPath { get; set; } = AppContext.BaseDirectory;

        public string EnvironmentName { get; set; } = Environments.Development;

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
