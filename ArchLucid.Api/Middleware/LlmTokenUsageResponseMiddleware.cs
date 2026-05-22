using ArchLucid.AgentRuntime;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Appends <c>X-ArchLucid-Token-Usage</c> when the request pipeline invoked an LLM completion on this thread.
/// </summary>
internal sealed class LlmTokenUsageResponseMiddleware : IMiddleware
{
    internal const string HeaderName = "X-ArchLucid-Token-Usage";

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        await next(context);

        AgentCompletionTokenUsage.TryPeek(out int? promptTokens, out int? completionTokens, out int? reasoningTokens);

        if (promptTokens is null && completionTokens is null && reasoningTokens is null)
            return;

        if (context.Response.HasStarted)
            return;

        context.Response.Headers[HeaderName] = FormatHeaderValue(promptTokens, completionTokens, reasoningTokens);
    }

    internal static string FormatHeaderValue(int? promptTokens, int? completionTokens, int? reasoningTokens)
    {
        List<string> parts = [];

        if (promptTokens is > 0)
            parts.Add($"prompt={promptTokens.Value}");

        if (completionTokens is > 0)
            parts.Add($"completion={completionTokens.Value}");

        if (reasoningTokens is > 0)
            parts.Add($"reasoning={reasoningTokens.Value}");

        return parts.Count == 0 ? "prompt=0,completion=0" : string.Join(',', parts);
    }
}
