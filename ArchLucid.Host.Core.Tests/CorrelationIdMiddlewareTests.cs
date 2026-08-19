using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_propagates_valid_inbound_correlation_and_sets_response_header()
    {
        const string expected = "abc-123";

        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;

            return Task.CompletedTask;
        };

        CorrelationIdMiddleware sut = new(next, CreateScopeProvider());
        DefaultHttpContext context = new();
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = expected;

        await sut.InvokeAsync(context);

        context.TraceIdentifier.Should().Be(expected);
        context.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(expected);
    }

    [Fact]
    public async Task InvokeAsync_falls_back_to_trace_identifier_when_header_invalid()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        CorrelationIdMiddleware sut = new(next, CreateScopeProvider());
        DefaultHttpContext context = new();
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "!!!";

        await sut.InvokeAsync(context);

        context.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(context.TraceIdentifier);
    }

    [Fact]
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

        CorrelationIdMiddleware sut = new(_ => Task.CompletedTask, scopeProvider.Object);
        DefaultHttpContext context = new();

        await sut.InvokeAsync(context);
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
