using System.Reflection;

using ArchLucid.Api.Swagger;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.OpenApi;

using Swashbuckle.AspNetCore.SwaggerGen;

namespace ArchLucid.Api.Tests.Swagger;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProblemDetailsResponsesOperationFilterTests
{
    [SkippableFact]
    public void Apply_run_execute_path_enriches_404_and_409_descriptions()
    {
        OpenApiOperation operation = new()
        {
            Responses = new OpenApiResponses
            {
                ["404"] = new OpenApiResponse { Description = "Not found." },
                ["409"] = new OpenApiResponse { Description = "Conflict." }
            }
        };

        ApiDescription apiDescription = new()
        {
            RelativePath = "v1/architecture/review/{runId}/execute",
            ActionDescriptor = new ActionDescriptor()
        };

        MethodInfo method = typeof(ProblemDetailsResponsesOperationFilter).GetMethod(
            nameof(ProblemDetailsResponsesOperationFilter.Apply),
            BindingFlags.Instance | BindingFlags.Public)!;

        OpenApiDocument document = new();
        OperationFilterContext context = new(
            apiDescription,
            null!,
            new SchemaRepository(),
            document,
            method);
        ProblemDetailsResponsesOperationFilter filter = new();

        filter.Apply(operation, context);

        operation.Responses!["404"].Description.Should().Contain("run-not-found");
        operation.Responses["409"].Description.Should().Contain("quality-gate-rejected");
    }
}
