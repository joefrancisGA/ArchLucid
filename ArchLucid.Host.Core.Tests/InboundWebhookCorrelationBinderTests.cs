using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InboundWebhookCorrelationBinderTests
{
    [Fact]
    public void EnsureIncomingCorrelationTags_does_not_throw_without_header()
    {
        DefaultHttpContext context = new();

        Action act = () => InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(context);

        act.Should().NotThrow();
    }
}
