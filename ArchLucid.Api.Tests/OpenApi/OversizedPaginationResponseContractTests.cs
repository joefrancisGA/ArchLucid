using System.Reflection;

using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Api.Controllers.OperationalSecurity;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class OversizedPaginationResponseContractTests
{
    [Theory]
    [InlineData(typeof(CloudResourceEvidenceHubController), nameof(CloudResourceEvidenceHubController.ListCloudResources))]
    [InlineData(typeof(CloudResourceEvidenceHubController), nameof(CloudResourceEvidenceHubController.GetHub))]
    [InlineData(typeof(OperationalSecurityPathsController), nameof(OperationalSecurityPathsController.ListPaths))]
    [InlineData(typeof(OperationalSecurityPathsController), nameof(OperationalSecurityPathsController.ListRankedPaths))]
    public void Pagination_oversize_response_is_documented_as_problem_json(Type controller, string method)
    {
        MethodInfo action = controller.GetMethod(method)!;
        ProducesResponseTypeAttribute response = action.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .Single(x => x.StatusCode == StatusCodes.Status413PayloadTooLarge);

        response.Type.Should().Be(typeof(ProblemDetails));
        response.ContentTypes.Should().Contain("application/problem+json");
    }
}
