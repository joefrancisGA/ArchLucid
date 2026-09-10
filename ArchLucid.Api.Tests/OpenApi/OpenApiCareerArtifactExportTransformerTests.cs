using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class OpenApiCareerArtifactExportTransformerTests
{
    [Fact]
    public async Task CareerArtifactExportTransformer_documents_blockReason_schema_on_first_value_pdf_409()
    {
        OpenApiOperation operation = new()
        {
            Responses = new OpenApiResponses
            {
                ["409"] = new OpenApiResponse
                {
                    Description = "Conflict.",
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/problem+json"] = new OpenApiMediaType
                        {
                            Schema = new OpenApiSchemaReference("ProblemDetails"),
                        },
                    },
                },
            },
        };

        MicrosoftOpenApiCareerArtifactExportOperationTransformer transformer = new();

        await transformer.TransformAsync(
            operation,
            new OpenApiOperationTransformerContext
            {
                DocumentName = "v1",
                ApplicationServices = new ServiceCollection().BuildServiceProvider(),
                Description = new ApiDescription
                {
                    HttpMethod = HttpMethods.Post,
                    RelativePath = "v1/pilots/runs/{runId}/first-value-report.pdf",
                },
            },
            CancellationToken.None);

        OpenApiMediaType mediaType = operation.Responses["409"].Content!["application/problem+json"];
        mediaType.Schema.Should().BeOfType<OpenApiSchemaReference>();
        ((OpenApiSchemaReference)mediaType.Schema!).Reference.Id.Should()
            .Be(MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer.SchemaName);
    }

    [Fact]
    public async Task CareerArtifactBlockedProblemDetailsDocumentTransformer_registers_schema()
    {
        OpenApiDocument document = new()
        {
            Components = new OpenApiComponents
            {
                Schemas = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
                {
                    ["ProblemDetails"] = new OpenApiSchema { Type = JsonSchemaType.Object },
                },
            },
        };

        MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer transformer = new();

        await transformer.TransformAsync(
            document,
            new OpenApiDocumentTransformerContext
            {
                DocumentName = "v1",
                DescriptionGroups = [],
                ApplicationServices = new ServiceCollection().BuildServiceProvider(),
            },
            CancellationToken.None);

        document.Components!.Schemas!.Should().ContainKey(
            MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer.SchemaName);

        OpenApiSchema schema = (OpenApiSchema)document.Components.Schemas[
            MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer.SchemaName];
        schema.Properties.Should().ContainKeys("blockReason", "blockReasonCode");
        schema.Required.Should().Contain("blockReason");
    }
}
