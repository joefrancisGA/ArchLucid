using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiOptionsTests
{
    [Fact]
    public void UseJsonSchemaResponseFormat_defaults_to_false_when_configuration_is_unset()
    {
        AzureOpenAiOptions options = new();

        options.UseJsonSchemaResponseFormat.Should().BeFalse();
    }
}
