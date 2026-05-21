using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>POST /v1/architecture/finding/{findingId}/feedback</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ArchitectureFindingFeedbackEndpointTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task PostFindingFeedback_WhenRunUnknown_Returns404Problem()
    {
        string token = factory.MintLocalBearerJwt("ExecuteUser", [ArchLucidRoles.Operator]);
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureFindingFeedbackPostRequest body = new()
        {
            RunId = runId,
            IsHelpful = true,
            Comment = "Useful finding"
        };

        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/v1/architecture/finding/missing-finding/feedback", UriKind.Relative),
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
