using System.Text.Json.Nodes;

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
        IList<string> enumNames = schema.Enum!
            .Select(static node => node?.GetValue<string>())
            .Where(static name => name is not null)
            .Cast<string>()
            .ToList();
        enumNames.Should().Contain("DecisionGradeFinding");
        enumNames.Should().Contain("ChecklistCoverage");
    }

    [Fact]
    public void ApplyParameterDefaultRewrite_rewrites_numeric_default_to_enum_name()
    {
        OpenApiSchema schema = new()
        {
            Default = JsonValue.Create(0)
        };

        OpenApiJsonStringEnumSchemaMutator.ApplyParameterDefaultRewrite(
            schema,
            typeof(FindingClassification));

        schema.Default!.GetValue<string>().Should().Be("DecisionGradeFinding");
    }

    [Fact]
    public void ApplyParameterDefaultRewrite_ignores_non_enum_types_and_non_numeric_defaults()
    {
        OpenApiSchema nonEnumSchema = new()
        {
            Default = JsonValue.Create(0)
        };

        OpenApiJsonStringEnumSchemaMutator.ApplyParameterDefaultRewrite(nonEnumSchema, typeof(string));

        nonEnumSchema.Default!.GetValue<int>().Should().Be(0);

        OpenApiSchema stringDefaultSchema = new()
        {
            Default = JsonValue.Create("NotAnEnumMember")
        };

        OpenApiJsonStringEnumSchemaMutator.ApplyParameterDefaultRewrite(
            stringDefaultSchema,
            typeof(FindingClassification));

        stringDefaultSchema.Default!.GetValue<string>().Should().Be("NotAnEnumMember");
    }

    [Fact]
    public void ApplyParameterDefaultRewrite_rewrites_default_on_schema_reference()
    {
        OpenApiSchemaReference schema = new("WorkspaceSystemNameOccupancyKind")
        {
            Default = JsonValue.Create(0)
        };

        OpenApiJsonStringEnumSchemaMutator.ApplyParameterDefaultRewrite(
            schema,
            typeof(ArchLucid.Contracts.Architecture.WorkspaceSystemNameOccupancyKind));

        schema.Default!.GetValue<string>().Should().Be("Review");
    }
}
