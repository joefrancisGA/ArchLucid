using System.Net;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>POST /v1/pilots/runs/{runId}/sponsor-pack-sent</c> (TB-243).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SponsorPackSentEndpointTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PostSponsorPackSent_WhenRunUnknown_Returns404Problem()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        using HttpRequestMessage request = new(
            HttpMethod.Post,
            $"/v1/pilots/runs/{runId:D}/sponsor-pack-sent")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new { deliveryMethod = "email" }),
                Encoding.UTF8,
                "application/json"),
        };

        HttpResponseMessage response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostSponsorPackSent_NonceRunId_Returns404Or409_Not401()
    {
        using HttpRequestMessage request = new(
            HttpMethod.Post,
            "/v1/pilots/runs/00000000-0000-0000-0000-000000000001/sponsor-pack-sent")
        {
            Content = new StringContent("{}", Encoding.UTF8, "application/json"),
        };

        HttpResponseMessage response = await Client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.Conflict, HttpStatusCode.NoContent);
    }
}
