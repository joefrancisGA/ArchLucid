using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures inline document <c>contentType</c> is rejected at the API boundary when not in
///     <see cref="ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes" />.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureRequestDocumentValidationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CreateRun_InvalidDocumentContentType_Returns400_WithFieldScopedError()
    {
        JsonNode root = JsonSerializer.SerializeToNode(
            TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(ArchitectureRequestDocumentValidationTests))),
            JsonOptions)!.AsObject();

        root["documents"] = new JsonArray
        {
            new JsonObject
            {
                ["name"] = "bad.bin",
                ["contentType"] = "application/pdf",
                ["content"] = "not a supported document body"
            }
        };

        HttpResponseMessage response = await Client.PostArchitectureRequestForTestAsync(root);

        JsonDocument problem = await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest);
        bool hasFieldScopedContentTypeError =
            ValidationProblemAssertions.ContainsDocumentContentTypeFieldError(problem.RootElement);

        hasFieldScopedContentTypeError.Should().BeTrue(
            "expected a validation key scoped to documents and content type in problem details");
    }
}
