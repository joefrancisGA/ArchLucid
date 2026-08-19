using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Normalizes JSON Schema shapes that confuse common C# OpenAPI generators (e.g. NJsonSchema/NSwag)
///     and contract fuzzers (Schemathesis):
///     <c>type: [integer, string]</c> with <c>format: int32</c> becomes plain integer;
///     nullable <c>oneOf: [null, $ref]</c> becomes <c>anyOf</c> so <c>null</c> is not a oneOf overlap.
/// </summary>
internal static class OpenApiCodeGenFriendlySchemaMutator
{
    internal static void Apply(OpenApiDocument document)
    {
        HashSet<IOpenApiSchema> visited = new(ReferenceEqualityComparer.Instance);
        HashSet<string> visitedReferenceIds = new(StringComparer.Ordinal);

        if (document.Components?.Schemas is not null)
        {
            foreach (IOpenApiSchema root in document.Components.Schemas.Values)
                Visit(root, document, visited, visitedReferenceIds);
        }

        if (document.Paths is null)
            return;

        foreach (IOpenApiPathItem pathItem in document.Paths.Values)
            VisitPathItem(pathItem, document, visited, visitedReferenceIds);
    }

    private static void VisitPathItem(
        IOpenApiPathItem pathItem,
        OpenApiDocument document,
        HashSet<IOpenApiSchema> visited,
        HashSet<string> visitedReferenceIds)
    {
        if (pathItem.Parameters is not null)
        {
            foreach (IOpenApiParameter parameter in pathItem.Parameters)
                Visit(parameter.Schema, document, visited, visitedReferenceIds);
        }

        if (pathItem.Operations is null)
            return;

        foreach (OpenApiOperation operation in pathItem.Operations.Values)
        {
            if (operation.Parameters is not null)
            {
                foreach (IOpenApiParameter parameter in operation.Parameters)
                    Visit(parameter.Schema, document, visited, visitedReferenceIds);
            }

            if (operation.RequestBody?.Content is not null)
            {
                foreach (OpenApiMediaType mediaType in operation.RequestBody.Content.Values)
                    Visit(mediaType.Schema, document, visited, visitedReferenceIds);
            }

            if (operation.Responses is null)
                continue;

            foreach (IOpenApiResponse response in operation.Responses.Values)
            {
                if (response.Content is null)
                    continue;

                foreach (OpenApiMediaType mediaType in response.Content.Values)
                    Visit(mediaType.Schema, document, visited, visitedReferenceIds);
            }
        }
    }

    private static void Visit(
        IOpenApiSchema? schema,
        OpenApiDocument document,
        HashSet<IOpenApiSchema> visited,
        HashSet<string> visitedReferenceIds)
    {
        if (schema is null)
            return;

        if (schema is OpenApiSchemaReference reference)
        {
            VisitReference(reference, document, visited, visitedReferenceIds);

            return;
        }

        if (!visited.Add(schema))
            return;

        CollapseIntegerStringUnion(schema);
        CollapseNullableRefOneOfToAnyOf(schema);

        if (schema.Properties is not null)
        {
            foreach (IOpenApiSchema propertySchema in schema.Properties.Values)
                Visit(propertySchema, document, visited, visitedReferenceIds);
        }

        Visit(schema.Items, document, visited, visitedReferenceIds);
        VisitList(schema.AllOf, document, visited, visitedReferenceIds);
        VisitList(schema.OneOf, document, visited, visitedReferenceIds);
        VisitList(schema.AnyOf, document, visited, visitedReferenceIds);
        Visit(schema.Not, document, visited, visitedReferenceIds);
        Visit(schema.AdditionalProperties, document, visited, visitedReferenceIds);
    }

    private static void VisitReference(
        OpenApiSchemaReference reference,
        OpenApiDocument document,
        HashSet<IOpenApiSchema> visited,
        HashSet<string> visitedReferenceIds)
    {
        string? referenceId = reference.Id;

        if (string.IsNullOrEmpty(referenceId))
            return;

        if (!visitedReferenceIds.Add(referenceId))
            return;

        CollapseIntegerStringUnion(reference);

        IDictionary<string, IOpenApiSchema>? schemas = document.Components?.Schemas;

        if (schemas is null || !schemas.TryGetValue(referenceId, out IOpenApiSchema? target))
            return;

        Visit(target, document, visited, visitedReferenceIds);
    }

    private static void VisitList(
        IList<IOpenApiSchema>? list,
        OpenApiDocument document,
        HashSet<IOpenApiSchema> visited,
        HashSet<string> visitedReferenceIds)
    {
        if (list is null)
            return;

        foreach (IOpenApiSchema item in list)
            Visit(item, document, visited, visitedReferenceIds);
    }

    private static void CollapseIntegerStringUnion(IOpenApiSchema schema)
    {
        if (schema is not OpenApiSchema mutable)
            return;

        if (!mutable.Type.HasValue)
            return;

        JsonSchemaType value = mutable.Type.Value;
        JsonSchemaType withoutNull = value & ~JsonSchemaType.Null;

        bool hasInteger = withoutNull.HasFlag(JsonSchemaType.Integer);
        bool hasString = withoutNull.HasFlag(JsonSchemaType.String);

        if (!hasInteger || !hasString)
            return;

        if (!string.Equals(mutable.Format, "int32", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(mutable.Format, "int64", StringComparison.OrdinalIgnoreCase))
            return;

        JsonSchemaType next = JsonSchemaType.Integer;

        if (value.HasFlag(JsonSchemaType.Null))
            next |= JsonSchemaType.Null;

        mutable.Type = next;
        mutable.Pattern = null;
    }

    /// <summary>
    ///     Schemathesis rejects response <c>null</c> when a property is <c>oneOf: [{type:null}, {$ref}]</c>
    ///     and the $ref target also admits null. <c>anyOf</c> allows the overlap.
    /// </summary>
    private static void CollapseNullableRefOneOfToAnyOf(IOpenApiSchema schema)
    {
        if (schema is not OpenApiSchema mutable)
            return;

        if (mutable.OneOf is not { Count: 2 })
            return;

        bool hasNull = false;
        bool hasRef = false;

        foreach (IOpenApiSchema entry in mutable.OneOf)
        {
            if (entry is OpenApiSchemaReference)
            {
                hasRef = true;
                continue;
            }

            if (entry is OpenApiSchema concrete &&
                concrete.Type == JsonSchemaType.Null)
            {
                hasNull = true;
            }
        }

        if (!hasNull || !hasRef)
            return;

        mutable.AnyOf = mutable.OneOf;
        mutable.OneOf = null;
    }
}
