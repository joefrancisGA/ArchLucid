using System.Reflection;
using System.Text.Json.Nodes;

using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class MicrosoftOpenApiStringEnumParameterDefaultOperationTransformerTests
{
    private enum SampleOccupancyKind
    {
        Review = 0,
        Architecture = 1,
    }

    [Fact]
    public async Task TransformAsync_rewrites_numeric_enum_parameter_default_to_member_name()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = new OpenApiSchemaReference("SampleOccupancyKind", document, null)
                    {
                        Default = JsonValue.Create(0),
                    },
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(SampleOccupancyKind));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        OpenApiParameter parameter = operation.Parameters![0].Should().BeOfType<OpenApiParameter>().Subject;
        parameter.Schema!.Default.Should().BeAssignableTo<JsonValue>()
            .Which.GetValue<string>().Should().Be(nameof(SampleOccupancyKind.Review));
    }

    [Fact]
    public async Task TransformAsync_rewrites_nonzero_enum_parameter_default_to_member_name()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = new OpenApiSchemaReference("SampleOccupancyKind", document, null)
                    {
                        Default = JsonValue.Create(1),
                    },
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(SampleOccupancyKind));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        OpenApiParameter parameter = operation.Parameters![0].Should().BeOfType<OpenApiParameter>().Subject;
        parameter.Schema!.Default.Should().BeAssignableTo<JsonValue>()
            .Which.GetValue<string>().Should().Be(nameof(SampleOccupancyKind.Architecture));
    }

    [Fact]
    public async Task TransformAsync_leaves_numeric_default_when_parameter_is_not_an_enum()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        OpenApiSchema schema = new() { Type = JsonSchemaType.Integer, Default = JsonValue.Create(0) };
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = schema,
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(int));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        schema.Default.Should().BeAssignableTo<JsonValue>().Which.GetValue<int>().Should().Be(0);
    }

    [Fact]
    public async Task TransformAsync_leaves_string_enum_default_untouched()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        IOpenApiSchema schema = new OpenApiSchemaReference("SampleOccupancyKind", document, null)
        {
            Default = JsonValue.Create("Architecture"),
        };
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = schema,
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(SampleOccupancyKind));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        schema.Default.Should().BeAssignableTo<JsonValue>().Which.GetValue<string>().Should().Be("Architecture");
    }

    [Fact]
    public async Task TransformAsync_leaves_numeric_default_when_value_is_not_a_defined_enum_member()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        IOpenApiSchema schema = new OpenApiSchemaReference("SampleOccupancyKind", document, null)
        {
            Default = JsonValue.Create(99),
        };
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = schema,
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(SampleOccupancyKind));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        schema.Default.Should().BeAssignableTo<JsonValue>().Which.GetValue<int>().Should().Be(99);
    }

    [Fact]
    public async Task TransformAsync_leaves_numeric_default_when_referenced_component_is_not_a_string_enum()
    {
        OpenApiDocument document = CreateDocumentWithSampleOccupancyKindComponent();
        document.Components!.Schemas!["SampleOccupancyKind"] = new OpenApiSchema
        {
            Type = JsonSchemaType.Integer,
        };
        IOpenApiSchema schema = new OpenApiSchemaReference("SampleOccupancyKind", document, null)
        {
            Default = JsonValue.Create(0),
        };
        OpenApiOperation operation = new()
        {
            Parameters =
            [
                new OpenApiParameter
                {
                    Name = "occupancyKind",
                    In = ParameterLocation.Query,
                    Schema = schema,
                },
            ],
        };

        OpenApiOperationTransformerContext context = CreateContext(document, typeof(SampleOccupancyKind));

        await new MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer()
            .TransformAsync(operation, context, CancellationToken.None);

        schema.Default.Should().BeAssignableTo<JsonValue>().Which.GetValue<int>().Should().Be(0);
    }

    private static OpenApiDocument CreateDocumentWithSampleOccupancyKindComponent() =>
        new()
        {
            Components = new OpenApiComponents
            {
                Schemas = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
                {
                    ["SampleOccupancyKind"] = new OpenApiSchema
                    {
                        Type = JsonSchemaType.String,
                        Enum =
                        [
                            (JsonNode)JsonValue.Create("Review")!,
                            (JsonNode)JsonValue.Create("Architecture")!,
                        ],
                    },
                },
            },
        };

    private static OpenApiOperationTransformerContext CreateContext(OpenApiDocument document, Type parameterType) =>
        new()
        {
            DocumentName = "v1",
            Document = document,
            ApplicationServices = new ServiceCollection().BuildServiceProvider(),
            Description = new ApiDescription { ActionDescriptor = CreateDescriptor(parameterType) },
        };

    private static ControllerActionDescriptor CreateDescriptor(Type parameterType)
    {
        MethodInfo method = typeof(SampleController).GetMethod(
            nameof(SampleController.Action),
            BindingFlags.Instance | BindingFlags.Public)!;

        ParameterInfo parameter = method.GetParameters()[0];
        ControllerParameterDescriptor parameterDescriptor = new()
        {
            Name = parameter.Name!,
            ParameterType = parameterType,
            ParameterInfo = new FakeParameterInfo(parameter.Name!, parameterType),
        };

        return new ControllerActionDescriptor
        {
            MethodInfo = method,
            ControllerTypeInfo = typeof(SampleController).GetTypeInfo(),
            Parameters = [parameterDescriptor],
        };
    }

    private sealed class FakeParameterInfo(string name, Type parameterType) : ParameterInfo
    {
        public override string Name => name;
        public override Type ParameterType => parameterType;
    }

    private sealed class SampleController
    {
        public void Action(object occupancyKind)
        {
        }
    }
}
