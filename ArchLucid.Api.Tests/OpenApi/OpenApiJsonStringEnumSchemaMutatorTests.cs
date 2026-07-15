using ArchLucid.Api.OpenApi;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class OpenApiJsonStringEnumSchemaMutatorTests
{
    [Fact]
    public void Apply_rewrites_enum_schema_to_string_values()
    {
        OpenApiSchema schema = new()
        {
            Type = JsonSchemaType.Integer
        };

        OpenApiJsonStringEnumSchemaMutator.Apply(schema, typeof(FindingClassification));

        schema.Type.Should().Be(JsonSchemaType.String);
        schema.Enum.Should().Contain("DecisionGradeFinding");
        schema.Enum.Should().Contain("ChecklistCoverage");
    }
}
