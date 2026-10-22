using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.AgentRuntime.Tests.TestSupport;

/// <summary>Shared Development host + empty config for RealAgentExecutor unit construction (TB-950).</summary>
internal static class RealAgentExecutorTestHosting
{
    internal static IHostEnvironment DevelopmentEnvironment { get; } = new DevelopmentTestHostEnvironment();

    internal static IConfiguration EmptyConfiguration { get; } = new ConfigurationBuilder().Build();
}
