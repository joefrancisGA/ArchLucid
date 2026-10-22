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

    [Fact]
    public void ApplyToOperation_clears_media_types_on_204()
    {
        OpenApiOperation operation = new()
        {
            Responses = new OpenApiResponses
            {
                ["204"] = new OpenApiResponse
                {
                    Description = "No Content",
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/json"] = new OpenApiMediaType()
                    }
                }
            }
        };

        OpenApiStandardProblemDetailsMutator.ApplyToOperation(operation);

        operation.Responses["204"].Content.Should().BeNull();
        operation.Responses.Should().ContainKey("405");
        operation.Responses["405"].Content.Should().ContainKey("application/problem+json");
        operation.Responses.Should().ContainKey("415");
        operation.Responses["415"].Content.Should().ContainKey("application/problem+json");
    }
}
