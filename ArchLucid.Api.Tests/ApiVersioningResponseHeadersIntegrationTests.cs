using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Confirms Asp.Versioning response headers are present on versioned admin routes.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ApiVersioningResponseHeadersIntegrationTests(PlatformOperatorRoleArchLucidApiFactory factory)
    : IClassFixture<PlatformOperatorRoleArchLucidApiFactory>, IAsyncLifetime
{
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        _client = await factory.CreateBoundedClientAsync();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(_client);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [SkippableFact]
    public async Task Versioned_admin_route_exposes_supported_api_versions_header()
    {
        HttpResponseMessage response = await _client.GetAsync("/v1/admin/diagnostics/outboxes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("api-supported-versions", out IEnumerable<string>? values).Should().BeTrue();
        string joined = string.Join(",", values ?? []);
        joined.Should().Contain("1.0");
    }
}
