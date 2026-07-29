using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class OpenApiCodeGenFriendlySchemaMutatorTests
{
    [Fact]
    public void Apply_collapses_nullable_ref_oneOf_to_anyOf()
    {
        OpenApiSchema property = new()
        {
            OneOf =
            [
                new OpenApiSchema { Type = JsonSchemaType.Null },
                new OpenApiSchemaReference("FindingConfidenceLevel")
            ]
        };

        OpenApiDocument document = new()
        {
            Components = new OpenApiComponents
            {
                Schemas = new Dictionary<string, IOpenApiSchema>
                {
                    ["FindingTraceConfidenceDto"] = new OpenApiSchema
                    {
                        Properties = new Dictionary<string, IOpenApiSchema>
                        {
                            ["confidenceLevel"] = property
                        }
                    },
                    ["FindingConfidenceLevel"] = new OpenApiSchema
                    {
                        Type = JsonSchemaType.String,
                        Enum = ["High", "Medium", "Low"]
                    }
                }
            }
        };

        OpenApiCodeGenFriendlySchemaMutator.Apply(document);

        property.OneOf.Should().BeNull();
        property.AnyOf.Should().HaveCount(2);
    }

    [Fact]
    public void Apply_collapses_nullable_ref_anyOf_on_request_body_to_direct_ref()
    {
        OpenApiSchema requestSchema = new()
        {
            AnyOf =
            [
                new OpenApiSchema { Type = JsonSchemaType.Null },
                new OpenApiSchemaReference("CreateDraftRequest")
            ]
        };

        OpenApiDocument document = new()
        {
            Components = new OpenApiComponents
            {
                Schemas = new Dictionary<string, IOpenApiSchema>
                {
                    ["CreateDraftRequest"] = new OpenApiSchema
                    {
                        Type = JsonSchemaType.Object,
                        Properties = new Dictionary<string, IOpenApiSchema>
                        {
                            ["freeTextIntent"] = new OpenApiSchema { Type = JsonSchemaType.String }
                        }
                    }
                }
            },
            Paths = new OpenApiPaths
            {
                ["/v1/architecture/draft"] = new OpenApiPathItem
                {
                    Operations = new Dictionary<HttpMethod, OpenApiOperation>
                    {
                        [HttpMethod.Post] = new OpenApiOperation
                        {
                            RequestBody = new OpenApiRequestBody
                            {
                                Content = new Dictionary<string, OpenApiMediaType>
                                {
                                    ["application/json"] = new OpenApiMediaType
                                    {
                                        Schema = requestSchema
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        OpenApiCodeGenFriendlySchemaMutator.Apply(document);

        OpenApiOperation operation = document.Paths!["/v1/architecture/draft"].Operations![HttpMethod.Post];
        IOpenApiSchema schema = operation.RequestBody!.Content!["application/json"].Schema!;

        schema.Should().BeOfType<OpenApiSchemaReference>();
        ((OpenApiSchemaReference)schema).Id.Should().Be("CreateDraftRequest");
    }

    [Fact]
    public void Apply_collapses_int32_integer_string_union_on_parameters()
    {
        OpenApiSchema parameterSchema = new()
        {
            Type = JsonSchemaType.Integer | JsonSchemaType.String,
            Format = "int32",
            Pattern = "^-?(?:0|[1-9]\\d*)$"
        };

        OpenApiDocument document = new()
        {
            Paths = new OpenApiPaths
            {
                ["/v1/admin/diagnostics/data-consistency/orphan-comparison-records"] = new OpenApiPathItem
                {
                    Operations = new Dictionary<HttpMethod, OpenApiOperation>
                    {
                        [HttpMethod.Post] = new OpenApiOperation
                        {
                            Parameters =
                            [
                                new OpenApiParameter
                                {
                                    Name = "maxRows",
                                    In = ParameterLocation.Query,
                                    Schema = parameterSchema
                                }
                            ]
                        }
                    }
                }
            }
        };

        OpenApiCodeGenFriendlySchemaMutator.Apply(document);

        parameterSchema.Type.Should().Be(JsonSchemaType.Integer);
        parameterSchema.Pattern.Should().BeNull();
    }
}
