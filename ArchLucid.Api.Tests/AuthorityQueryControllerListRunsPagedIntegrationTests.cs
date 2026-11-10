using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <see cref="ArchLucid.Api.Controllers.Authority.AuthorityQueryController.ListRunsByProject" />:
///     <see cref="ArchLucid.Core.Pagination.CursorPagedResponse{T}" /> (keyset + legacy page/size clamping) after a
///     committed authority run exists.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AuthorityQueryControllerListRunsPagedIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListRunsByProject_without_page_returns_cursor_paged_envelope()
    {
        string requestId = TestRequestIds.ForScenario(nameof(AuthorityQueryControllerListRunsPagedIntegrationTests));
        string systemName = TestRequestFactory.SystemNameForRequest(requestId);

        FinalizedRun finalized = await ArrangeFinalizedAsync();
        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/projects/{Uri.EscapeDataString(systemName)}/reviews?take=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;
        root.ValueKind.Should().Be(JsonValueKind.Object);
        root.GetProperty("items").ValueKind.Should().Be(JsonValueKind.Array);
        root.GetProperty("items").GetArrayLength().Should().BeGreaterThan(0);
        root.GetProperty("requestedTake").GetInt32().Should().Be(20);
        root.TryGetProperty("nextCursor", out JsonElement _).Should().BeTrue();
        root.GetProperty("hasMore").ValueKind.Should().BeOneOf(JsonValueKind.True, JsonValueKind.False);
    }

    [SkippableFact]
    public async Task ListRunsByProject_with_legacy_page_size_clamps_requested_take()
    {
        string requestId = TestRequestIds.ForScenario(nameof(AuthorityQueryControllerListRunsPagedIntegrationTests));
        string systemName = TestRequestFactory.SystemNameForRequest(requestId);

        FinalizedRun finalized = await ArrangeFinalizedAsync();
        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/authority/projects/{Uri.EscapeDataString(systemName)}/reviews?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;
        root.GetProperty("items").ValueKind.Should().Be(JsonValueKind.Array);
        root.GetProperty("items").GetArrayLength().Should().BeGreaterThan(0);
        root.GetProperty("requestedTake").GetInt32().Should().Be(10);
        root.TryGetProperty("nextCursor", out JsonElement _).Should().BeTrue();
        root.GetProperty("hasMore").ValueKind.Should().BeOneOf(JsonValueKind.True, JsonValueKind.False);
    }

    [SkippableFact]
    public async Task ListRunsInScope_includes_run_hidden_from_default_project_slug()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage defaultSlugResponse =
            await Client.GetAsync("/v1/authority/projects/default/reviews?take=50");
        defaultSlugResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string defaultBody = await defaultSlugResponse.Content.ReadAsStringAsync();
        using JsonDocument defaultDoc = JsonDocument.Parse(defaultBody);
        Guid createdRunId = Guid.Parse(finalized.RunId);
        defaultDoc.RootElement.GetProperty("items").EnumerateArray()
            .Any(item => Guid.Parse(item.GetProperty("finalized.RunId").GetString()!) == createdRunId)
            .Should()
            .BeFalse("create maps SystemName onto the run project slug, not 'default'");

        HttpResponseMessage scopeResponse = await Client.GetAsync("/v1/authority/reviews?take=50");
        scopeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string scopeBody = await scopeResponse.Content.ReadAsStringAsync();
        using JsonDocument scopeDoc = JsonDocument.Parse(scopeBody);
        JsonElement scopeRoot = scopeDoc.RootElement;
        scopeRoot.GetProperty("items").EnumerateArray()
            .Any(item => Guid.Parse(item.GetProperty("finalized.RunId").GetString()!) == createdRunId)
            .Should()
            .BeTrue();
        scopeRoot.GetProperty("requestedTake").GetInt32().Should().Be(50);
        scopeRoot.TryGetProperty("nextCursor", out JsonElement _).Should().BeTrue();
        scopeRoot.GetProperty("hasMore").ValueKind.Should().BeOneOf(JsonValueKind.True, JsonValueKind.False);
    }
}
