using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Host.Composition.Services.Probes;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Composition.Tests.Services;

[Trait("Suite", "Core")]
public sealed class WorkspaceAiFallbackLiveCompletionProbeTests
{
    [Fact]
    public async Task TryProbeAfterPrimaryFailureAsync_disabled_returns_false_without_check()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:FallbackLlm:Enabled"] = "false",
                })
            .Build();

        List<WorkspaceAiAvailabilityCheckRow> checks = [];
        Dictionary<string, string> debug = new(StringComparer.Ordinal);

        bool ok = await WorkspaceAiFallbackLiveCompletionProbe.TryProbeAfterPrimaryFailureAsync(
            configuration,
            NullLogger<AzureOpenAiCompletionClient>.Instance,
            checks,
            debug,
            CancellationToken.None);

        ok.Should().BeFalse();
        checks.Should().BeEmpty();
        debug["fallbackLlmEnabled"].Should().Be("False");
    }

    [Fact]
    public async Task TryProbeAfterPrimaryFailureAsync_enabled_without_endpoints_adds_failed_check()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:FallbackLlm:Enabled"] = "true",
                })
            .Build();

        List<WorkspaceAiAvailabilityCheckRow> checks = [];
        Dictionary<string, string> debug = new(StringComparer.Ordinal);

        bool ok = await WorkspaceAiFallbackLiveCompletionProbe.TryProbeAfterPrimaryFailureAsync(
            configuration,
            NullLogger<AzureOpenAiCompletionClient>.Instance,
            checks,
            debug,
            CancellationToken.None);

        ok.Should().BeFalse();
        debug["fallbackLlmEnabled"].Should().Be("True");
        checks.Should().Contain(row =>
            row.Name == "azure_openai_fallback_live_completion_probe" && row.Status == "failed");
    }
}
