using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>ADR 0088 / LW-024: document fail-closed draft PATCH CAS without making forceOverwrite JSON-required.</summary>
internal static class MicrosoftOpenApiDraftPatchCasSchemaMutator
{
    internal const string SchemaName = "PatchDraftRequest";

    internal const string ExpectedUpdatedUtcDescription =
        "Required unless forceOverwrite is true. Must match the current draft updatedUtc. Omit returns HTTP 409 with code draft_cas_token_missing, not last-write-wins (ADR 0088).";

    internal const string ForceOverwriteDescription =
        "When true, skips CAS and overwrites the server draft (Keep mine). Never defaults to true. Writes a Required audit event. JSON Schema cannot express required-unless-forceOverwrite.";

    internal static void Apply(OpenApiSchema schema)
    {
        ArgumentNullException.ThrowIfNull(schema);

        SetPropertyDescription(schema, "expectedUpdatedUtc", ExpectedUpdatedUtcDescription);
        SetPropertyDescription(schema, "forceOverwrite", ForceOverwriteDescription);
    }

    private static void SetPropertyDescription(OpenApiSchema schema, string propertyName, string description)
    {
        if (schema.Properties is null)
            return;

        if (!schema.Properties.TryGetValue(propertyName, out IOpenApiSchema? property))
            return;

        if (property is OpenApiSchema mutable)
            mutable.Description = description;
    }
}
