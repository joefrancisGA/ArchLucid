using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
public sealed class AzureOpenAiVendorProbeErrorFormatterTests
{
    [Fact]
    public void Format_generic_exception_includes_type_and_message()
    {
        string formatted = AzureOpenAiVendorProbeErrorFormatter.Format(new InvalidOperationException("bad config"));

        formatted.Should().Be("InvalidOperationException: bad config");
    }

    [Fact]
    public void FormatProbeTimedOut_includes_deployment_and_budget()
    {
        string formatted = AzureOpenAiVendorProbeErrorFormatter.FormatProbeTimedOut("gpt-4o", TimeSpan.FromSeconds(5));

        formatted.Should().Contain("gpt-4o");
        formatted.Should().Contain("5");
    }
}
