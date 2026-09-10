using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class MicrosoftOpenApiDraftPatchCasDocumentTransformerTests
{
    [Fact]
    public async Task TransformAsync_documents_fail_closed_cas_without_making_force_overwrite_required()
    {
        OpenApiDocument document = new()
        {
            Components = new OpenApiComponents
            {
                Schemas = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
                {
                    ["PatchDraftRequest"] = new OpenApiSchema
                    {
                        Properties = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
                        {
                            ["expectedUpdatedUtc"] = new OpenApiSchema
                            {
                                Type = JsonSchemaType.String | JsonSchemaType.Null,
                                Format = "date-time",
                            },
                            ["forceOverwrite"] = new OpenApiSchema
                            {
                                Type = JsonSchemaType.Boolean | JsonSchemaType.Null,
                            },
                        },
                    },
                },
            },
        };

        MicrosoftOpenApiDraftPatchCasDocumentTransformer transformer = new();
        OpenApiDocumentTransformerContext context = new()
        {
            DocumentName = "v1",
            ApplicationServices = new ServiceCollection().BuildServiceProvider(),
        };

        await transformer.TransformAsync(document, context, CancellationToken.None);

        OpenApiSchema schema = document.Components!.Schemas!["PatchDraftRequest"].Should().BeOfType<OpenApiSchema>().Subject;
        OpenApiSchema expected = schema.Properties!["expectedUpdatedUtc"].Should().BeOfType<OpenApiSchema>().Subject;
        OpenApiSchema forceOverwrite = schema.Properties!["forceOverwrite"].Should().BeOfType<OpenApiSchema>().Subject;

        expected.Description.Should().Contain("draft_cas_token_missing");
        expected.Description.Should().Contain("forceOverwrite");
        expected.Description.Should().NotContain("last-write-wins without", "omit is 409, not silent LWW");
        forceOverwrite.Description.Should().Contain("Never defaults to true");
        forceOverwrite.Description.Should().Contain("Required audit");
        schema.Required.Should().BeNull("JSON Schema cannot express required unless forceOverwrite");
    }
}
