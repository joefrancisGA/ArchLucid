using System.Diagnostics;
using System.Net;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Tests.Controllers;
using ArchLucid.Api.Tests.Http;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Middleware;

/// <summary>
///     Regression matrix for ADR 0053 correlation flow: HTTP headers, Problem Details, and scope Activity tags (TB-334).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ObservabilityCorrelationIntegrationTests
    : IClassFixture<ObservabilityCorrelationIntegrationApiFactory>
{
    private readonly ObservabilityCorrelationIntegrationApiFactory _factory;

    public ObservabilityCorrelationIntegrationTests(ObservabilityCorrelationIntegrationApiFactory factory)
    {
        _factory = factory;
    }

    [SkippableFact]
    public async Task Scoped_request_propagates_correlation_traceparent_and_problem_details_correlation()
    {
        using HttpClient client = _factory.CreateClient();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        const string correlationId = "obs-corr-matrix-probe";

        using HttpRequestMessage request = new(HttpMethod.Get, "/api-test/unhandled/throw");
        request.Headers.TryAddWithoutValidation(CorrelationIdHeaderParser.HeaderName, correlationId);
        request.Headers.TryAddWithoutValidation("x-tenant-id", tenantId.ToString("D"));
        request.Headers.TryAddWithoutValidation("x-workspace-id", workspaceId.ToString("D"));

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Headers.TryGetValues(CorrelationIdHeaderParser.HeaderName, out IEnumerable<string>? correlationHeaders)
            .Should()
            .BeTrue();
        correlationHeaders!.Single().Should().Be(correlationId);
        response.Headers.TryGetValues("traceparent", out IEnumerable<string>? traceParentHeaders).Should().BeTrue();
        traceParentHeaders!.Single().Should().NotBeNullOrWhiteSpace();

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        root.GetProperty(ProblemCorrelation.ExtensionKey).GetString().Should().Be(correlationId);
        root.TryGetProperty("traceParent", out JsonElement traceParentExtension).Should().BeTrue();
        traceParentExtension.GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Correlation_middleware_sets_scope_activity_tags_before_response()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        using ActivityListener listener = new();
        listener.ShouldListenTo = _ => true;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        ActivitySource.AddActivityListener(listener);

        using Activity? parent = new ActivitySource("ObservabilityCorrelationIntegrationTests").StartActivity("request");
        parent.Should().NotBeNull();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = workspaceId });

        TraceResponseHeaderMiddleware trace = new(_ => Task.CompletedTask);
        CorrelationIdMiddleware correlation = new(trace.InvokeAsync, scopeProvider.Object);

        DefaultHttpContext context =
            OnStartingCapturingHttpResponseFeature.CreateContext(out OnStartingCapturingHttpResponseFeature capture);
        context.Request.Headers["x-tenant-id"] = tenantId.ToString("D");
        context.Request.Headers["x-workspace-id"] = workspaceId.ToString("D");
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "scope-tag-probe";

        await correlation.InvokeAsync(context);
        await capture.InvokeOnStartingCallbacksAsync();

        parent!.GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        parent.GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
        context.Response.Headers["traceparent"].ToString().Should().NotBeNullOrWhiteSpace();
    }
}

/// <summary>Registers <see cref="InternalServerErrorProbeController" /> for correlation matrix probes.</summary>
public sealed class ObservabilityCorrelationIntegrationApiFactory : ArchLucidApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureServices(services =>
        {
            services.AddControllers()
                .PartManager.ApplicationParts.Add(
                    new AssemblyPart(typeof(InternalServerErrorProbeController).Assembly));
        });
    }
}
