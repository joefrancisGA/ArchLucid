using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CorrelationIdHeaderParserTests
{
    [Fact]
    public void TryGetValidIncomingCorrelationId_returns_false_when_header_absent()
    {
        HeaderDictionary headers = new();

        bool ok = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out string? id);

        ok.Should().BeFalse();
        id.Should().BeNull();
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_accepts_trimmed_safe_token()
    {
        HeaderDictionary headers = new();
        headers[CorrelationIdHeaderParser.HeaderName] = "  abc-123.XY_  ";

        bool ok = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out string? id);

        ok.Should().BeTrue();
        id.Should().Be("abc-123.XY_");
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_rejects_unsafe_characters()
    {
        HeaderDictionary headers = new();
        headers[CorrelationIdHeaderParser.HeaderName] = "bad;drop";

        bool ok = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out string? id);

        ok.Should().BeFalse();
        id.Should().BeNull();
    }

    [Fact]
    public void TryGetValidIncomingCorrelationId_rejects_overlong_value()
    {
        HeaderDictionary headers = new();
        headers[CorrelationIdHeaderParser.HeaderName] = new string('a', 65);

        bool ok = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(headers, out string? id);

        ok.Should().BeFalse();
        id.Should().BeNull();
    }
}
