using System.Net;

using System.Text.Json;

using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/policy-packs/{id}/explain</c>.</summary>
[Trait("Category", "Integration")]
public sealed class PolicyPackExplainEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Explain_returns_markdown_when_pack_exists_in_scope()
    {
        const string contentJson = """
                                   {
                                     "complianceRuleIds": [],
                                     "complianceRuleKeys": [],
                                     "alertRuleIds": [],
                                     "compositeAlertRuleIds": [],
                                     "advisoryDefaults": {},
                                     "metadata": { "explainTest": "yes" }
                                   }
                                   """;

        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/policy-packs",
            JsonContent(
                new
                {
                    name = "explain-endpoint-pack",
                    description = "test",
                    packType = "ProjectCustom",
                    initialContentJson = contentJson
                }));

        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string createBody = await createResponse.Content.ReadAsStringAsync();
        PolicyPack? created = JsonSerializer.Deserialize<PolicyPack>(createBody, JsonOptions);
        created.Should().NotBeNull();

        HttpResponseMessage explainResponse =
            await Client.GetAsync($"/v1/policy-packs/{created!.PolicyPackId}/explain");

        explainResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        explainResponse.Content.Headers.ContentType?.MediaType.Should().Be("text/markdown");
        string body = await explainResponse.Content.ReadAsStringAsync();
        body.Should().Contain("## Purpose");
    }

    [SkippableFact]
    public async Task Explain_returns_404_when_pack_unknown()
    {
        HttpResponseMessage explainResponse =
            await Client.GetAsync($"/v1/policy-packs/{Guid.NewGuid():D}/explain");

        explainResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
