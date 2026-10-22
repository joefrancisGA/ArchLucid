using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Advisory.Learning;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Integration tests for <c>/v1/recommendation-learning/ops-page</c> bundle.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class RecommendationLearningOpsPageTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetOpsPage_Default_ReturnsOk_WithStatusAndHistory()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/recommendation-learning/ops-page");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        RecommendationLearningOpsPageResponse? body =
            await response.Content.ReadFromJsonAsync<RecommendationLearningOpsPageResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Status.Should().NotBeNull();
        body.History.Should().NotBeNull();
    }
}
