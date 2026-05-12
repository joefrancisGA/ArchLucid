using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests;

/// <summary>Top 25 #23: inbound ITSM webhooks reinforce logical correlation on <see cref="Activity" />.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InboundWebhookCorrelationBinderTests
{
    [Fact]
    public void EnsureIncomingCorrelationTags_sets_correlation_id_tag_on_current_activity()
    {
        using Activity activity = new("ArchLucid.Tests.InboundWebhookCorrelationBinder");

        activity.Start();

        try
        {
            DefaultHttpContext httpContext = new();
            httpContext.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "itsm-webhook-corr-42";

            InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(httpContext);

            activity.GetTagItem(ActivityCorrelation.LogicalCorrelationIdTag).Should().Be("itsm-webhook-corr-42");
        }
        finally
        {
            activity.Stop();
        }
    }

    [Fact]
    public void EnsureIncomingCorrelationTags_is_noop_when_header_absent()
    {
        using Activity activity = new("ArchLucid.Tests.InboundWebhookCorrelationBinder.NoHeader");

        activity.Start();

        try
        {
            DefaultHttpContext httpContext = new();

            InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(httpContext);

            activity.GetTagItem(ActivityCorrelation.LogicalCorrelationIdTag).Should().BeNull();
        }
        finally
        {
            activity.Stop();
        }
    }

    [Fact]
    public void EnsureIncomingCorrelationTags_is_idempotent_when_chain_already_matches_header()
    {
        using Activity activity = new("ArchLucid.Tests.InboundWebhookCorrelationBinder.Idempotent");

        activity.Start();

        try
        {
            activity.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, "same-corr");

            DefaultHttpContext httpContext = new();
            httpContext.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "same-corr";

            InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(httpContext);

            activity.GetTagItem(ActivityCorrelation.LogicalCorrelationIdTag).Should().Be("same-corr");
        }
        finally
        {
            activity.Stop();
        }
    }
}
