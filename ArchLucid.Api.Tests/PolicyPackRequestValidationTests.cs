using System.Net;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Policy Pack Request Validation.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class PolicyPackRequestValidationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public Task CreatePolicyPack_InvalidInitialContentJson_Returns400WithValidationErrors()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(CreatePolicyPack_InvalidInitialContentJson_Returns400WithValidationErrors),
            async testDeadline =>
            {
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                var body = new
                {
                    name = "Bad JSON pack",
                    description = "",
                    packType = "ProjectCustom",
                    initialContentJson = "{ not valid json"
                };

                HttpResponseMessage response = await Client.PostAsync(
                    "/v1/policy-packs",
                    JsonContent(body),
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                string text = await response.Content.ReadAsStringAsync(requestTimeout.Token);
                text.Should().ContainEquivalentOf("InitialContentJson");
            },
            IntegrationTestDeadline.SharedHostTestTimeout);
    }

    [SkippableFact]
    public Task PublishPolicyPack_InvalidSemVerVersion_Returns400()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(PublishPolicyPack_InvalidSemVerVersion_Returns400),
            async testDeadline =>
            {
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                HttpResponseMessage createResponse = await Client.PostAsync(
                    "/v1/policy-packs",
                    JsonContent(
                        new
                        {
                            name = "SemVer validation pack",
                            description = "",
                            packType = "ProjectCustom",
                            initialContentJson = "{}"
                        }),
                    requestTimeout.Token);

                createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                using JsonDocument created = JsonDocument.Parse(
                    await createResponse.Content.ReadAsStringAsync(requestTimeout.Token));

                Guid packId = created.RootElement.GetProperty("policyPackId").GetGuid();

                HttpResponseMessage publishResponse = await Client.PostAsync(
                    $"/v1/policy-packs/{packId}/publish",
                    JsonContent(new { version = "1.0", contentJson = "{}" }),
                    requestTimeout.Token);

                publishResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                string text = await publishResponse.Content.ReadAsStringAsync(requestTimeout.Token);
                text.Should().ContainEquivalentOf("Version");
            },
            IntegrationTestDeadline.SharedHostTestTimeout);
    }

    [SkippableFact]
    public Task AssignPolicyPack_InvalidScopeLevel_Returns400()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(AssignPolicyPack_InvalidScopeLevel_Returns400),
            async testDeadline =>
            {
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                HttpResponseMessage createResponse = await Client.PostAsync(
                    "/v1/policy-packs",
                    JsonContent(
                        new
                        {
                            name = "Scope validation pack",
                            description = "",
                            packType = "ProjectCustom",
                            initialContentJson = "{}"
                        }),
                    requestTimeout.Token);

                createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                using JsonDocument created = JsonDocument.Parse(
                    await createResponse.Content.ReadAsStringAsync(requestTimeout.Token));

                Guid packId = created.RootElement.GetProperty("policyPackId").GetGuid();

                HttpResponseMessage assignResponse = await Client.PostAsync(
                    $"/v1/policy-packs/{packId}/assign",
                    JsonContent(new { version = "1.0.0", scopeLevel = "Planet" }),
                    requestTimeout.Token);

                assignResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                string text = await assignResponse.Content.ReadAsStringAsync(requestTimeout.Token);
                text.Should().ContainEquivalentOf("ScopeLevel");
            },
            IntegrationTestDeadline.SharedHostTestTimeout);
    }
}
