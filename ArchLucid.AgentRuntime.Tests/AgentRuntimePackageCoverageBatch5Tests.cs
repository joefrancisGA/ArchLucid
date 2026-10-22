using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch5Tests
{
    [Fact]
    public void LlmTelemetryLabelOptions_exposes_default_provider_labels()
    {
        LlmTelemetryLabelOptions options = new();

        options.ProviderId.Should().Be("unknown");
        options.ModelDeploymentLabel.Should().Be("unknown");
    }

    [Fact]
    public void AgentPromptActivityTags_noops_when_no_current_activity()
    {
        ResolvedSystemPrompt resolved = new(
            Text: "prompt",
            TemplateId: "topology-v1",
            TemplateVersion: "1",
            ContentSha256Hex: "abc123",
            ReleaseLabel: "rc10");

        Action act = () => AgentPromptActivityTags.Apply(resolved);

        act.Should().NotThrow();
    }
}
