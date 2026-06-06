using ArchLucid.Api.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;

namespace ArchLucid.Api.Tests.Middleware;

/// <summary>TB-305 / ADR 0042 coverage for <see cref="RunAliasDeprecationMiddleware" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunAliasDeprecationMiddlewareTests
{
    [Fact]
    public async Task Deprecated_alias_route_emits_deprecation_and_successor_link()
    {
        (DefaultHttpContext context, StartTrackingResponseFeature response) =
            CreateContextWithEndpoint("v{version:apiVersion}/runs/{runId}/submit");

        await InvokeAsync(context);
        await response.FireOnStartingAsync();

        response.Headers["Deprecation"].ToString().Should().Be("true");
        response.Headers["Link"].ToString()
            .Should()
            .Contain("architecture/run/{runId}/execute")
            .And.Contain("successor-version")
            .And.Contain("ADR-0042");
    }

    [Fact]
    public async Task Canonical_route_emits_no_deprecation_header()
    {
        (DefaultHttpContext context, StartTrackingResponseFeature response) =
            CreateContextWithEndpoint("v{version:apiVersion}/architecture/run/{runId}/execute");

        await InvokeAsync(context);
        await response.FireOnStartingAsync();

        response.Headers.ContainsKey("Deprecation").Should().BeFalse();
    }

    [Fact]
    public async Task No_endpoint_emits_no_deprecation_header()
    {
        (DefaultHttpContext context, StartTrackingResponseFeature response) = CreateContext();

        await InvokeAsync(context);
        await response.FireOnStartingAsync();

        response.Headers.ContainsKey("Deprecation").Should().BeFalse();
    }

    private static Task InvokeAsync(HttpContext context)
    {
        RunAliasDeprecationMiddleware middleware = new(_ => Task.CompletedTask);

        return middleware.InvokeAsync(context);
    }

    private static (DefaultHttpContext, StartTrackingResponseFeature) CreateContext()
    {
        FeatureCollection features = new();
        features.Set<IHttpRequestFeature>(new HttpRequestFeature());
        StartTrackingResponseFeature response = new();
        features.Set<IHttpResponseFeature>(response);

        return (new DefaultHttpContext(features), response);
    }

    private static (DefaultHttpContext, StartTrackingResponseFeature) CreateContextWithEndpoint(string template)
    {
        (DefaultHttpContext context, StartTrackingResponseFeature response) = CreateContext();

        RoutePattern pattern = RoutePatternFactory.Parse(template);
        RouteEndpoint endpoint = new(
            _ => Task.CompletedTask,
            pattern,
            order: 0,
            EndpointMetadataCollection.Empty,
            displayName: template);

        context.SetEndpoint(endpoint);

        return (context, response);
    }

    // Self-contained response feature: DefaultHttpContext's built-in feature never invokes OnStarting callbacks, so the test
    // captures them and fires them explicitly to assert the deferred headers.
    private sealed class StartTrackingResponseFeature : IHttpResponseFeature
    {
        private readonly List<(Func<object, Task> Callback, object State)> _onStarting = [];

        public Stream Body { get; set; } = Stream.Null;

        public bool HasStarted { get; private set; }

        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();

        public string? ReasonPhrase { get; set; }

        public int StatusCode { get; set; } = StatusCodes.Status200OK;

        public void OnCompleted(Func<object, Task> callback, object state)
        {
        }

        public void OnStarting(Func<object, Task> callback, object state) => _onStarting.Add((callback, state));

        public async Task FireOnStartingAsync()
        {
            HasStarted = true;

            foreach ((Func<object, Task> callback, object state) in _onStarting)

                await callback(state);
        }
    }
}
