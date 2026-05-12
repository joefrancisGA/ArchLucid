using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests;

/// <summary>Regression: shared parser aligns Serilog enrichment with correlation middleware acceptance rules.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorrelationIdHeaderParserTests
{
    [Fact]
    public void TryGetValidIncomingCorrelationId_returns_true_for_safe_ascii_token()
    {
        IHeaderDictionary headers = new HeaderDictionary();
        headers[CorrelationIdHeaderParser.HeaderName] = "op-tenant-1.Trace_abc.01";

        bool ok =
            CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out string? correlationId);

        ok.Should().BeTrue();
        correlationId.Should().Be("op-tenant-1.Trace_abc.01");
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_returns_false_when_missing()
    {
        IHeaderDictionary headers = new HeaderDictionary();

        CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out _)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_returns_false_for_overlong_values()
    {
        IHeaderDictionary headers = new HeaderDictionary();
        headers[CorrelationIdHeaderParser.HeaderName] = new string('a', 65);

        CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out _)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_returns_false_for_unsafe_characters()
    {
        IHeaderDictionary headers = new HeaderDictionary();
        headers[CorrelationIdHeaderParser.HeaderName] = "../etc/passwd";

        CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out _)
            .Should()
            .BeFalse();
    }
}
