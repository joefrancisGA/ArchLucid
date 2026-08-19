using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlConnectionCredentialRulesTests
{
    [Fact]
    public void Collect_in_production_rejects_password_in_sql_connection_string()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] =
                "Server=tcp:localhost;Database=ArchLucid;User Id=sa;Password=Secret123;Encrypt=True;TrustServerCertificate=True",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        SqlConnectionCredentialRules.Collect(configuration, environment, options, errors);

        errors.Should().ContainSingle();
        errors[0].Should().Contain("Password");
    }

    [Fact]
    public void Collect_in_production_rejects_user_id_without_authentication()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] =
                "Server=tcp:localhost;Database=ArchLucid;User Id=sa;Encrypt=True;TrustServerCertificate=True",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        SqlConnectionCredentialRules.Collect(configuration, environment, options, errors);

        errors.Should().ContainSingle();
        errors[0].Should().Contain("User ID without Authentication");
    }

    [Fact]
    public void Collect_skips_in_development_and_inmemory_storage()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] =
                "Server=tcp:localhost;Database=ArchLucid;User Id=sa;Password=Secret123;Encrypt=True;TrustServerCertificate=True",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Development };
        ArchLucidOptions sqlOptions = new() { StorageProvider = "Sql" };
        ArchLucidOptions inMemoryOptions = new() { StorageProvider = "InMemory" };
        List<string> developmentErrors = [];
        List<string> inMemoryErrors = [];

        SqlConnectionCredentialRules.Collect(configuration, environment, sqlOptions, developmentErrors);
        SqlConnectionCredentialRules.Collect(configuration, environment, inMemoryOptions, inMemoryErrors);

        developmentErrors.Should().BeEmpty();
        inMemoryErrors.Should().BeEmpty();
    }

    [Fact]
    public void LogStagingWarningsIfPresent_logs_when_sql_password_present()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] =
                "Server=tcp:localhost;Database=ArchLucid;User Id=sa;Password=Secret123;Encrypt=True;TrustServerCertificate=True",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Staging };
        TestLoggerProvider loggerProvider = new();

        SqlConnectionCredentialRules.LogStagingWarningsIfPresent(
            configuration,
            environment,
            loggerProvider.CreateLogger("test"));

        loggerProvider.Entries.Should().ContainSingle();
        loggerProvider.Entries[0].Level.Should().Be(LogLevel.Warning);
        loggerProvider.Entries[0].Message.Should().Contain("Password");
    }

    [Fact]
    public void DescribePasswordCredentialIssue_returns_null_when_connection_is_clean()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] =
                "Server=tcp:localhost;Database=ArchLucid;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=True",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        ArchLucidOptions options = new() { StorageProvider = "Sql" };

        string? message = SqlConnectionCredentialRules.DescribePasswordCredentialIssue(configuration, options);

        message.Should().BeNull();
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string WebRootPath { get; set; } = string.Empty;

        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TestLoggerProvider : ILoggerProvider
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public ILogger CreateLogger(string categoryName) => new TestLogger(Entries);

        public void Dispose()
        {
        }
    }

    private sealed class TestLogger(List<(LogLevel Level, string Message)> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            entries.Add((logLevel, formatter(state, exception)));
        }
    }

    private sealed class NullScope : IDisposable
    {
        public static readonly NullScope Instance = new();

        public void Dispose()
        {
        }
    }
}
