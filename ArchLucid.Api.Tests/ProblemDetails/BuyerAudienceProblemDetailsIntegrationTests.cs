using System.Net;
using System.Text.Json;

using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Api.Tests.ProblemDetails;

/// <summary>
///     TB-284 golden: buyer audience problem+json must not leak internal route topology.
/// </summary>
[Trait("Category", "Integration")]
public sealed class BuyerAudienceProblemDetailsIntegrationTests
{
    [Fact]
    public async Task Buyer_audience_404_problem_does_not_contain_v1_route_strings()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        client.DefaultRequestHeaders.Remove(ProblemDetailsAudienceHttpContext.AudienceHeaderName);
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation(ProblemDetailsAudienceHttpContext.AudienceHeaderName, "buyer");

        Guid missingRun = Guid.Parse("00000000-0000-0000-0000-000000000099");
        HttpResponseMessage response = await client.GetAsync($"/v1/authority/reviews/{missingRun:D}/buyer-summary");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("supportHint", out JsonElement hint))
        {
            string hintText = hint.GetString() ?? "";
            hintText.Should().NotContain("GET /v1/");
            hintText.Should().NotContain("/v1/");
            hintText.Should().NotContain("/swagger");
        }
    }
}
