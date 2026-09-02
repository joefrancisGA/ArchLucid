using System.Net;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     MVC pipeline coverage for <c>PUT /v1/tenant/core-pilot-checklist</c> validation failures.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class CorePilotTeamChecklistEndpointTests
{
    private const string EndpointPath = "/v1/tenant/core-pilot-checklist";

    [Theory]
    [InlineData("{\"stepIndex\":1}", "$", "missing required properties including: 'isCompleted'")]
    [InlineData("{\"stepIndex\":1,\"isCompleted\":null}", "$.isCompleted", "could not be converted to System.Boolean")]
    public async Task Put_missing_or_null_is_completed_returns_400_validation_problem(
        string payload,
        string expectedErrorKey,
        string expectedMessageFragment)
    {
        await using AlertLifecycleWebAppFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        using StringContent body = new(payload, Encoding.UTF8, "application/json");

        using HttpResponseMessage response = await client.PutAsync(EndpointPath, body);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("type").GetString().Should().Be(ProblemTypes.ValidationFailed);
        root.GetProperty("status").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
        root.GetProperty("errors").GetProperty(expectedErrorKey).EnumerateArray()
            .Select(static message => message.GetString())
            .Should().Contain(message => message != null
                && message.Contains(expectedMessageFragment, StringComparison.Ordinal));
    }
}
