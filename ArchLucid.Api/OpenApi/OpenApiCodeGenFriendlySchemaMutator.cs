using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Normalizes JSON Schema shapes that confuse common C# OpenAPI generators (e.g. NJsonSchema/NSwag):
///     <c>type: [integer, string]</c> with <c>format: int32</c> becomes plain integer. The ASP.NET Core
///     OpenAPI stack can emit integer|string unions for some CLR numeric shapes; clients should treat
///     these as JSON numbers only.
/// </summary>
internal static class OpenApiCodeGenFriendlySchemaMutator
{
    internal static void Apply(OpenApiDocument document)
    {
        if (document.Components?.Schemas is null)
            return;

        HashSet<IOpenApiSchema> visited = new(ReferenceEqualityComparer.Instance);
        HashSet<string> visitedReferenceIds = new(StringComparer.Ordinal);

        foreach (IOpenApiSchema root in document.Components.Schemas.Values)

            Visit(root, document, visited, visitedReferenceIds);
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

        if (schema.Properties is not null)

            foreach (IOpenApiSchema propertySchema in schema.Properties.Values)

                Visit(propertySchema, document, visited, visitedReferenceIds);

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

        if (!string.Equals(mutable.Format, "int32", StringComparison.OrdinalIgnoreCase))
            return;

        JsonSchemaType next = JsonSchemaType.Integer;

        if (value.HasFlag(JsonSchemaType.Null))

            next |= JsonSchemaType.Null;

        mutable.Type = next;
        mutable.Pattern = null;
    }
}
