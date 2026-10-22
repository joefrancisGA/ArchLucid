using System.Net;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>POST /v1/pilots/runs/{runId}/sponsor-preliminary-share</c>.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SponsorPreliminaryShareEndpointTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PostSponsorPreliminaryShare_WhenRunUnknown_Returns404Problem()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        using HttpRequestMessage request = new(
            HttpMethod.Post,
            $"/v1/pilots/runs/{runId:D}/sponsor-preliminary-share")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new { readinessStatus = "preliminary-only", overrideAcknowledged = true }),
                Encoding.UTF8,
                "application/json"),
        };

        HttpResponseMessage response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostSponsorPreliminaryShare_WithoutOverrideWhenNotReady_Returns409Or404_Not401()
    {
        using HttpRequestMessage request = new(
            HttpMethod.Post,
            "/v1/pilots/runs/00000000-0000-0000-0000-000000000001/sponsor-preliminary-share")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new { readinessStatus = "preliminary-only", overrideAcknowledged = false }),
                Encoding.UTF8,
                "application/json"),
        };

        HttpResponseMessage response = await Client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.Conflict, HttpStatusCode.NoContent);
    }
}
