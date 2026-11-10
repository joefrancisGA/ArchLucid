using System.Net;
using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>Thin wrappers over <see cref="ArchLucidHttpResponseIntegrationTestExtensions.AssertProblemForTestAsync" />.</summary>
public static class HarnessProblemAssertions
{
    public static Task<JsonDocument> AssertRunNotFoundAsync(
        this HttpResponseMessage response,
        string? problemType = null) =>
        response.AssertProblemForTestAsync(HttpStatusCode.NotFound, problemType ?? ProblemTypes.RunNotFound);

    public static Task<JsonDocument> AssertBadRequestDetailContainsAsync(
        this HttpResponseMessage response,
        string detailContains) =>
        response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, detailContains: detailContains);
}
