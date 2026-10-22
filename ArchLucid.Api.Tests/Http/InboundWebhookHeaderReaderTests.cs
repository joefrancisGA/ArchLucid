using ArchLucid.Api.Http;

using FluentAssertions;

using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Tests.Http;

[Trait("Category", "Unit")]
public sealed class InboundWebhookHeaderReaderTests
{
    [Fact]
    public void ExtractFirstNonEmptyHeader_uses_first_non_blank_duplicate_value()
    {
        StringValues values = new([" ", "t=123,v1=abc"]);

        InboundWebhookHeaderReader.ExtractFirstNonEmptyHeader(values).Should().Be("t=123,v1=abc");
        values.ToString().Should().Contain(",");
    }

    [Fact]
    public void ExtractBearerToken_uses_first_non_blank_bearer_header()
    {
        StringValues values = new([" ", "Bearer marketplace-token"]);

        InboundWebhookHeaderReader.ExtractBearerToken(values).Should().Be("marketplace-token");
    }
}
