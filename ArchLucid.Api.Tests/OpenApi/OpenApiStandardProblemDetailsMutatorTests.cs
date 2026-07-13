using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class OpenApiStandardProblemDetailsMutatorTests
{
    [Fact]
    public void ApplyToOperation_adds_problem_json_for_standard_status_codes()
    {
        OpenApiOperation operation = new()
        {
            Responses = new OpenApiResponses
            {
                ["200"] = new OpenApiResponse { Description = "OK" }
            }
        };

        OpenApiStandardProblemDetailsMutator.ApplyToOperation(operation);

        operation.Responses.Should().ContainKey("401");
        operation.Responses["401"].Content.Should().ContainKey("application/problem+json");
        operation.Responses.Should().ContainKey("400");
        operation.Responses["400"].Content.Should().ContainKey("application/problem+json");
    }

    [Fact]
    public void ApplyToOperation_adds_problem_json_to_existing_error_response()
    {
        OpenApiOperation operation = new()
        {
            Responses = new OpenApiResponses
            {
                ["404"] = new OpenApiResponse
                {
                    Description = "Not found.",
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/json"] = new OpenApiMediaType()
                    }
                }
            }
        };

        OpenApiStandardProblemDetailsMutator.ApplyToOperation(operation);

        operation.Responses["404"].Content.Should().ContainKey("application/problem+json");
        operation.Responses["404"].Content.Should().ContainKey("application/json");
    }
}
