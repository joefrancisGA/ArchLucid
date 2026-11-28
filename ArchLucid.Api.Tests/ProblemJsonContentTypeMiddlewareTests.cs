using ArchLucid.Api.Middleware;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;

using Xunit;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProblemJsonContentTypeMiddlewareTests
{
    [Theory]
    [InlineData(400, "application/json", "application/problem+json")]
    [InlineData(500, "Application/JSON; charset=utf-8", "application/problem+json")]
    [InlineData(400, "text/json; charset=utf-8", "application/problem+json")]
    [InlineData(200, "application/json", "application/json")]
    [InlineData(400, "application/problem+json; charset=utf-8", "application/problem+json; charset=utf-8")]
    [InlineData(400, "application/json-seq", "application/json-seq")]
    [InlineData(400, "text/plain", "text/plain")]
    [InlineData(500, null, null)]
    public async Task InvokeAsync_NormalizesOnlyOrdinaryJsonErrors(
        int statusCode,
        string? contentType,
        string? expectedContentType)
    {
        StartingResponseFeature responseFeature = new();
        FeatureCollection features = new();
        features.Set<IHttpResponseFeature>(responseFeature);
        DefaultHttpContext context = new(features);

        ProblemJsonContentTypeMiddleware middleware = new(httpContext =>
        {
            httpContext.Response.StatusCode = statusCode;
            httpContext.Response.ContentType = contentType;
            return responseFeature.StartAsync();
        });

        await middleware.InvokeAsync(context);

        Assert.Equal(expectedContentType, context.Response.ContentType);
        Assert.Equal(statusCode, context.Response.StatusCode);
    }

    private sealed class StartingResponseFeature : HttpResponseFeature
    {
        private Func<object, Task>? _callback;
        private object? _state;

        public override void OnStarting(Func<object, Task> callback, object state)
        {
            _callback = callback;
            _state = state;
        }

        public Task StartAsync() => _callback?.Invoke(_state!) ?? Task.CompletedTask;
    }
}
