using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace ArchiForge.Api.Tests;

[Trait("Category", "Integration")]
public sealed class PolicyPacksIntegrationTests(ArchiForgeApiFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task PolicyPack_CreateAssignEffective_Lifecycle()
    {
        var contentJson = """
            {
              "complianceRuleIds": [],
              "alertRuleIds": [],
              "compositeAlertRuleIds": [],
              "advisoryDefaults": { "scanDepth": "standard" },
              "metadata": { "tier": "test" }
            }
            """;

        var createResponse = await Client.PostAsync(
            "/api/policy-packs",
            JsonContent(
                new
                {
                    name = "Integration test pack",
                    description = "lifecycle",
                    packType = "ProjectCustom",
                    initialContentJson = contentJson,
                }));

        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await createResponse.Content.ReadFromJsonAsync<PolicyPackResponse>(JsonOptions);
        created.Should().NotBeNull();
        var packId = created!.PolicyPackId;

        var assignResponse = await Client.PostAsync(
            $"/api/policy-packs/{packId}/assign",
            JsonContent(new { version = "1.0.0" }));

        assignResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var effectiveResponse = await Client.GetAsync("/api/policy-packs/effective");
        effectiveResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var effective = await effectiveResponse.Content.ReadFromJsonAsync<EffectivePolicyPackSetResponse>(JsonOptions);
        effective.Should().NotBeNull();
        effective!.Packs.Should().HaveCount(1);
        effective.Packs[0].PolicyPackId.Should().Be(packId);
        effective.Packs[0].Version.Should().Be("1.0.0");

        var mergedResponse = await Client.GetAsync("/api/policy-packs/effective-content");
        mergedResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var merged = await mergedResponse.Content.ReadFromJsonAsync<PolicyPackContentResponse>(JsonOptions);
        merged.Should().NotBeNull();
        merged!.AdvisoryDefaults.Should().ContainKey("scanDepth");
        merged.AdvisoryDefaults["scanDepth"].Should().Be("standard");
        merged.Metadata.Should().ContainKey("tier");
    }

    private sealed class PolicyPackResponse
    {
        public Guid PolicyPackId { get; set; }
        public string Name { get; set; } = "";
    }

    private sealed class EffectivePolicyPackSetResponse
    {
        public List<ResolvedPackResponse> Packs { get; set; } = [];
    }

    private sealed class ResolvedPackResponse
    {
        public Guid PolicyPackId { get; set; }
        public string Version { get; set; } = "";
    }

    private sealed class PolicyPackContentResponse
    {
        public Dictionary<string, string> AdvisoryDefaults { get; set; } = new();
        public Dictionary<string, string> Metadata { get; set; } = new();
    }
}
