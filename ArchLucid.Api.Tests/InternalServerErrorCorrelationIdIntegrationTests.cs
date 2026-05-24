using System.Net;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Tests.Controllers;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Asserts unhandled exceptions return RFC 9457 Problem Details with <c>X-Correlation-ID</c> on the response.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class InternalServerErrorCorrelationIdIntegrationTests : IClassFixture<InternalServerErrorCorrelationIdApiFactory>
{
    private readonly InternalServerErrorCorrelationIdApiFactory _factory;

    public InternalServerErrorCorrelationIdIntegrationTests(InternalServerErrorCorrelationIdApiFactory factory)
    {
        _factory = factory;
    }

    [SkippableFact]
    public async Task Unhandled_exception_returns_500_with_correlation_id_header_and_body_extension()
    {
        using HttpClient client = _factory.CreateClient();
        const string correlationId = "batch3-corr-500-probe";

        using HttpRequestMessage request = new(HttpMethod.Get, "/api-test/unhandled/throw");
        request.Headers.TryAddWithoutValidation(CorrelationIdHeaderParser.HeaderName, correlationId);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Headers.TryGetValues(CorrelationIdHeaderParser.HeaderName, out IEnumerable<string>? headerValues)
            .Should()
            .BeTrue();
        headerValues!.Single().Should().Be(correlationId);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        root.GetProperty("status").GetInt32().Should().Be(500);
        root.GetProperty(ProblemCorrelation.ExtensionKey).GetString().Should().Be(correlationId);
    }
}

/// <summary>Registers <see cref="InternalServerErrorProbeController" /> on the in-memory API host.</summary>
public sealed class InternalServerErrorCorrelationIdApiFactory : ArchLucidApiFactory
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
