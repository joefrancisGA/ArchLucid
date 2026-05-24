using ArchLucid.AgentRuntime.PromptInjection;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.PromptInjection;

public sealed class AzureResourceTagPromptSanitizerTests
{
    [Fact]
    public void SanitizeTagMap_wraps_values_in_untrusted_delimiters()
    {
        IReadOnlyDictionary<string, string> sanitized =
            AzureResourceTagPromptSanitizer.SanitizeTagMap(new Dictionary<string, string> { ["env"] = "prod" });

        sanitized["env"].Should().Contain("<untrusted_input>prod</untrusted_input>");
    }
}
