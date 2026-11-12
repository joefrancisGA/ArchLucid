using System.Net;
using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>Thin wrappers over <see cref="ArchLucidHttpResponseIntegrationTestExtensions.AssertProblemForTestAsync" />.</summary>
public static class HarnessProblemAssertions
{
    public static Task<JsonElement> AssertRunNotFoundAsync(
        this HttpResponseMessage response,
        string? problemType = null) =>
        response.AssertProblemElementForTestAsync(HttpStatusCode.NotFound, problemType ?? ProblemTypes.RunNotFound);

    public static Task<JsonElement> AssertBadRequestDetailContainsAsync(
        this HttpResponseMessage response,
        string detailContains) =>
        response.AssertProblemElementForTestAsync(HttpStatusCode.BadRequest, detailContains: detailContains);
}
