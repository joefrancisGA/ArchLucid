using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="CorrelationIdMiddleware" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CorrelationIdMiddlewareTests
{
    [SkippableFact]
    public async Task InvokeAsync_valid_header_sets_response_and_trace_identifier()
    {
        DefaultHttpContext context = new() { TraceIdentifier = "default-trace" };
        context.Request.Headers["X-Correlation-ID"] = "safe-id_01";

        CorrelationIdMiddleware middleware = new(_ => Task.CompletedTask, CreateScopeProvider());

        await middleware.InvokeAsync(context);

        context.Response.Headers["X-Correlation-ID"].ToString().Should().Be("safe-id_01");
        context.TraceIdentifier.Should().Be("safe-id_01");
    }

    [SkippableFact]
    public async Task InvokeAsync_invalid_header_falls_back_to_trace_identifier()
    {
        DefaultHttpContext context = new() { TraceIdentifier = "fallback-trace" };
        context.Request.Headers["X-Correlation-ID"] = "bad id has spaces";

        CorrelationIdMiddleware middleware = new(_ => Task.CompletedTask, CreateScopeProvider());

        await middleware.InvokeAsync(context);

        context.Response.Headers["X-Correlation-ID"].ToString().Should().Be("fallback-trace");
        context.TraceIdentifier.Should().Be("fallback-trace");
    }

    [SkippableFact]
    public async Task InvokeAsync_invokes_next_delegate()
    {
        DefaultHttpContext context = new();
        bool nextCalled = false;
        CorrelationIdMiddleware middleware = new(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, CreateScopeProvider());

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    [SkippableFact]
    public async Task InvokeAsync_sets_tenant_and_workspace_activity_tags_from_scope()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        using ActivityListener listener = new();
        listener.ShouldListenTo = _ => true;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        ActivitySource.AddActivityListener(listener);

        using Activity? parent = new ActivitySource("CorrelationIdMiddlewareTests").StartActivity("request");
        parent.Should().NotBeNull();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = workspaceId });

        CorrelationIdMiddleware middleware = new(_ => Task.CompletedTask, scopeProvider.Object);
        DefaultHttpContext context = new();

        await middleware.InvokeAsync(context);
        await context.Response.StartAsync();

        parent!.GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        parent.GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
    }

    private static IScopeContextProvider CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext());

        return scopeProvider.Object;
    }
}
