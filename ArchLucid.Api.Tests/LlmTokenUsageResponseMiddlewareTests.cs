using ArchLucid.AgentRuntime;
using ArchLucid.Api.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmTokenUsageResponseMiddlewareTests
{
    [SkippableFact]
    public async Task InvokeAsync_appends_header_when_token_usage_is_available()
    {
        AzureOpenAiCompletionClient.TestingSetLastCompletionTokenUsage(120, 45);

        LlmTokenUsageResponseMiddleware middleware = new();
        DefaultHttpContext context = new();

        await middleware.InvokeAsync(context, _ => Task.CompletedTask);

        context.Response.Headers[LlmTokenUsageResponseMiddleware.HeaderName].ToString()
            .Should().Be("prompt=120,completion=45");
    }

    [SkippableFact]
    public async Task InvokeAsync_does_not_append_header_when_no_usage()
    {
        LlmTokenUsageResponseMiddleware middleware = new();
        DefaultHttpContext context = new();

        await middleware.InvokeAsync(context, _ => Task.CompletedTask);

        context.Response.Headers.ContainsKey(LlmTokenUsageResponseMiddleware.HeaderName).Should().BeFalse();
    }

    [SkippableTheory]
    [InlineData(10, 20, null, "prompt=10,completion=20")]
    [InlineData(null, 5, 2, "completion=5,reasoning=2")]
    public void FormatHeaderValue_formats_available_counts(
        int? prompt,
        int? completion,
        int? reasoning,
        string expected)
    {
        LlmTokenUsageResponseMiddleware.FormatHeaderValue(prompt, completion, reasoning).Should().Be(expected);
    }
}
