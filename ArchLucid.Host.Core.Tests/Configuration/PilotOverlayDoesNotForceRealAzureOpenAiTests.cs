using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Host.Core.Tests.Configuration;

/// <summary>
///     Locks the committed Pilot overlay to scale-honest defaults so local
///     <c>dotnet run</c> (DevelopmentBypass + Simulator) does not require Azure OpenAI.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotOverlayDoesNotForceRealAzureOpenAiTests
{
    private static readonly string RepoRoot = LocateRepoRoot();

    [Fact]
    public void Committed_pilot_overlay_does_not_set_real_mode_or_partial_azure_openai()
    {
        IConfiguration pilot = LoadJson("ArchLucid.Api/appsettings.Pilot.json");

        string? mode = pilot["AgentExecution:Mode"];

        if (!string.IsNullOrWhiteSpace(mode))
            mode.Should().NotBeEquivalentTo("Real");

        string? endpoint = pilot["AzureOpenAI:Endpoint"];
        string? deployment = pilot["AzureOpenAI:DeploymentName"];
        string? embedding = pilot["AzureOpenAI:EmbeddingDeploymentName"];

        endpoint.Should().BeNullOrWhiteSpace();
        deployment.Should().BeNullOrWhiteSpace();
        embedding.Should().BeNullOrWhiteSpace();
    }

    [Fact]
    public void CollectErrors_when_shipped_development_plus_pilot_overlay_does_not_require_azure_openai()
    {
        IConfiguration configuration = LoadShippedDevelopmentHostJson();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        string? mode = configuration["AgentExecution:Mode"];
        mode.Should().NotBeEquivalentTo("Real");
        errors.Should().NotContain(e => e.Contains("Azure OpenAI is not fully configured", StringComparison.Ordinal));
        AssertAzureOpenAiIsNotPartiallyConfigured(configuration);
    }

    [Fact]
    public void Collect_when_real_without_azure_openai_names_simulator_escape_hatch()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                    ["AgentExecution:Mode"] = "Real",
                })
            .Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        string? msg = errors.FirstOrDefault(e => e.Contains("AZURE_OPENAI_ENDPOINT", StringComparison.Ordinal));
        msg.Should().NotBeNull();
        msg.Should().Contain("AZURE_OPENAI_API_KEY");
        msg.Should().Contain("AZURE_OPENAI_DEPLOYMENT_NAME");
        msg.Should().Contain("AgentExecution:Mode=Simulator");
        msg.Should().Contain("appsettings.Real.sample.json");
    }

    private static void AssertAzureOpenAiIsNotPartiallyConfigured(IConfiguration configuration)
    {
        bool hasEndpoint = !string.IsNullOrWhiteSpace(configuration["AzureOpenAI:Endpoint"]);
        bool hasDeployment = !string.IsNullOrWhiteSpace(configuration["AzureOpenAI:DeploymentName"]);
        bool hasApiKey = !string.IsNullOrWhiteSpace(configuration["AzureOpenAI:ApiKey"]);
        string authenticationMode = configuration["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
        bool usesManagedIdentity = string.Equals(
            authenticationMode,
            "ManagedIdentity",
            StringComparison.OrdinalIgnoreCase);

        if (!hasEndpoint && !hasApiKey && !hasDeployment)
            return;

        (hasEndpoint && hasDeployment && (hasApiKey || usesManagedIdentity)).Should().BeTrue(
            "partial Azure OpenAI on the shipped Development+Pilot overlay fails AzureOpenAiOptionsValidator");
    }

    private static IConfiguration LoadShippedDevelopmentHostJson()
    {
        // Mirrors ArchLucid.Api Program.cs JSON layers before environment variables.
        return new ConfigurationBuilder()
            .AddJsonFile(Absolute("ArchLucid.Api/appsettings.json"), optional: false)
            .AddJsonFile(Absolute("ArchLucid.Api/appsettings.Development.json"), optional: false)
            .AddJsonFile(Absolute("ArchLucid.Api/appsettings.Pilot.json"), optional: false)
            .AddJsonFile(Absolute("ArchLucid.Api/appsettings.Advanced.json"), optional: false)
            .Build();
    }

    private static IConfiguration LoadJson(string relativePath)
    {
        return new ConfigurationBuilder().AddJsonFile(Absolute(relativePath), optional: false).Build();
    }

    private static string Absolute(string relativePath)
    {
        string absolute = Path.Combine(RepoRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(absolute))
            throw new FileNotFoundException($"Config file must exist: {relativePath}", absolute);

        return absolute;
    }

    private static string LocateRepoRoot()
    {
        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 12 && current is not null; depth++)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            if (Directory.Exists(Path.Combine(current.FullName, "ArchLucid.Api"))
                && Directory.Exists(Path.Combine(current.FullName, "docs")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate ArchLucid repository root from test base directory.");
    }
}
