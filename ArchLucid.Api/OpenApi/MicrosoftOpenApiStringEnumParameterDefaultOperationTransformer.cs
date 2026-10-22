using System.Text.Json.Nodes;

using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Rewrites numeric OpenAPI defaults on parameters whose CLR type is an enum to the matching
///     enum member name. Framework generation emits the CLR value (e.g. <c>0</c>) even when
///     <see cref="MicrosoftOpenApiJsonStringEnumSchemaTransformer" /> converts the referenced enum
///     schema to strings, which is invalid for string schemas and breaks client generators.
///     Applies only when the CLR type is an enum and the value names a member of the referenced
///     string-enum component schema; non-enum defaults are left untouched.
/// </summary>
public sealed class MicrosoftOpenApiStringEnumParameterDefaultOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (operation.Parameters is null || operation.Parameters.Count == 0)
            return Task.CompletedTask;

        IReadOnlyDictionary<string, Type> enumTypesByParameterName = GetEnumTypesByParameterName(context.Description);

        if (enumTypesByParameterName.Count == 0)
            return Task.CompletedTask;

        foreach (IOpenApiParameter parameter in operation.Parameters)
        {
            if (parameter is not OpenApiParameter { Name: { Length: > 0 } parameterName } mutable)
                continue;

            if (!TryGetNumericDefault(mutable.Schema, out int defaultNumber))
                continue;

            if (!enumTypesByParameterName.TryGetValue(parameterName, out Type? enumType))
                continue;

            if (!Enum.IsDefined(enumType, defaultNumber))
                continue;

            string defaultName = Enum.GetName(enumType, defaultNumber)!;

            if (!StringEnumComponentDeclaresMember(context, mutable.Schema!, defaultName))
                continue;

            switch (mutable.Schema)
            {
                case OpenApiSchema schema:
                    schema.Default = JsonValue.Create(defaultName);
                    break;
                case OpenApiSchemaReference reference:
                    reference.Default = JsonValue.Create(defaultName);
                    break;
            }
        }

        return Task.CompletedTask;
    }

    private static bool TryGetNumericDefault(IOpenApiSchema? schema, out int defaultNumber)
    {
        defaultNumber = 0;

        JsonNode? defaultNode = schema switch
        {
            OpenApiSchema concrete => concrete.Default,
            OpenApiSchemaReference reference => reference.Default,
            _ => null,
        };

        return defaultNode is JsonValue value && value.TryGetValue(out defaultNumber);
    }

    private static IReadOnlyDictionary<string, Type> GetEnumTypesByParameterName(ApiDescription description)
    {
        if (description.ActionDescriptor is not ControllerActionDescriptor controllerAction)
            return new Dictionary<string, Type>(0, StringComparer.Ordinal);

        Dictionary<string, Type> enumTypesByParameterName = new(StringComparer.Ordinal);

        foreach (ParameterDescriptor parameterDescriptor in controllerAction.Parameters)
        {
            if (parameterDescriptor is not ControllerParameterDescriptor controllerParameter)
                continue;

            Type parameterType = Nullable.GetUnderlyingType(controllerParameter.ParameterInfo.ParameterType)
                ?? controllerParameter.ParameterInfo.ParameterType;

            if (!parameterType.IsEnum)
                continue;

            enumTypesByParameterName[parameterDescriptor.Name] = parameterType;
        }

        return enumTypesByParameterName;
    }

    private static bool StringEnumComponentDeclaresMember(
        OpenApiOperationTransformerContext context,
        IOpenApiSchema parameterSchema,
        string defaultName)
    {
        if (parameterSchema is not OpenApiSchemaReference reference
            || reference.Reference?.Id is not { Length: > 0 } schemaId)
            return false;

        if (context.Document?.Components?.Schemas is not { Count: > 0 } components
            || !components.TryGetValue(schemaId, out IOpenApiSchema? component)
            || component is null)
            return false;
        return component.Enum?.Any(node =>
                node is JsonValue value
                && value.TryGetValue(out string? name)
                && string.Equals(name, defaultName, StringComparison.Ordinal))
            == true;
    }
}
