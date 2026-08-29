using ArchLucid.Core.DevTesting;
using ArchLucid.Host.Core.DevTesting;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.DevTesting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EffectiveAgentExecutionModeAccessorTests
{
    [Fact]
    public void GetEffectiveMode_when_override_disabled_returns_configured_mode()
    {
        DefaultHttpContext httpContext = new();
        EffectiveAgentExecutionModeAccessor accessor = CreateAccessor(
            httpContext,
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" },
            isDevelopment: true,
            allowHeaderOverride: false);

        accessor.GetEffectiveMode().Should().Be("Simulator");
    }

    [Fact]
    public void GetEffectiveMode_when_override_enabled_and_header_missing_defaults_to_real()
    {
        DefaultHttpContext httpContext = new();
        EffectiveAgentExecutionModeAccessor accessor = CreateAccessor(
            httpContext,
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" },
            isDevelopment: true,
            allowHeaderOverride: true);

        accessor.GetEffectiveMode().Should().Be("Real");
    }

    [Fact]
    public void GetEffectiveMode_when_override_enabled_honors_simulator_header()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Request.Headers[DevAgentExecutionModeHeaderNames.Header] = "Simulator";

        EffectiveAgentExecutionModeAccessor accessor = CreateAccessor(
            httpContext,
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Real" },
            isDevelopment: true,
            allowHeaderOverride: true);

        accessor.GetEffectiveMode().Should().Be("Simulator");
    }

    private static EffectiveAgentExecutionModeAccessor CreateAccessor(
        HttpContext httpContext,
        IReadOnlyDictionary<string, string?> settings,
        bool isDevelopment,
        bool allowHeaderOverride)
    {
        Dictionary<string, string?> configValues = new(settings)
        {
            ["DeveloperExperience:AllowAgentExecutionModeHeaderOverride"] = allowHeaderOverride ? "true" : "false",
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        HttpContextAccessor httpContextAccessor = new() { HttpContext = httpContext };
        TestHostEnvironment hostEnvironment = new(isDevelopment);

        return new EffectiveAgentExecutionModeAccessor(httpContextAccessor, configuration, hostEnvironment);
    }

    private sealed class TestHostEnvironment(bool isDevelopment) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = isDevelopment ? Environments.Development : Environments.Production;

        public string ApplicationName { get; set; } = "ArchLucid.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
