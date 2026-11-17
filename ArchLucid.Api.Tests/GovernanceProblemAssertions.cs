using System.Net;
using System.Text.Json;

using ArchLucid.Host.Core.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>Governance-oriented wrappers over <see cref="ArchLucidHttpResponseIntegrationTestExtensions.AssertProblemForTestAsync" />.</summary>
public static class GovernanceProblemAssertions
{
    public static Task<JsonDocument> AssertGovernanceProblemAsync(
        this HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string expectedTypeUri) =>
        response.AssertProblemForTestAsync(expectedStatus, expectedTypeUri);

    public static Task<JsonDocument> AssertGovernanceSelfApprovalAsync(this HttpResponseMessage response) =>
        response.AssertGovernanceProblemAsync(HttpStatusCode.BadRequest, ProblemTypes.GovernanceSelfApproval);
}
