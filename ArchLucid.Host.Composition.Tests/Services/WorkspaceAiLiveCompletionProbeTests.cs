using ArchLucid.Host.Composition.Services;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.Services;

[Trait("Suite", "Core")]
public sealed class WorkspaceAiLiveCompletionProbeTests
{
    [Fact]
    public void Probe_prompts_mention_json_for_json_object_response_format()
    {
        WorkspaceAiLiveCompletionProbe.ProbeSystemPrompt
            .Should()
            .ContainEquivalentOf("json", because: "Azure OpenAI rejects json_object response_format without json in messages");

        WorkspaceAiLiveCompletionProbe.ProbeUserPrompt
            .Should()
            .ContainEquivalentOf("json", because: "Azure OpenAI rejects json_object response_format without json in messages");
    }
}
