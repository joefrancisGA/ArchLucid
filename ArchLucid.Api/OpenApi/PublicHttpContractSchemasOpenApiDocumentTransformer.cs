using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Documents server guarantees on high-traffic v1 schemas: <c>required</c> arrays and request-body validation parity.
/// </summary>
public sealed class PublicHttpContractSchemasOpenApiDocumentTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        ApplyRunSummaryResponse(document);
        ApplyRunRecord(document);
        ApplyManifestSummaryResponse(document);
        ApplyArchitectureRequest(document);
        ApplyContextDocumentRequest(document);

        return Task.CompletedTask;
    }

    private static void ApplyRunSummaryResponse(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "RunSummaryResponse", out OpenApiSchema schema))
            return;

        schema.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        OpenApiSchemaContractMutator.AddBooleanIfMissing(schema.Properties, "isSample");
        OpenApiSchemaContractMutator.AddBooleanIfMissing(schema.Properties, "hasWarnings");
        OpenApiSchemaContractMutator.AddBooleanIfMissing(schema.Properties, "hasGovernanceWarnings");

        OpenApiSchemaContractMutator.EnsureRequired(schema, "runId", "projectId", "createdUtc");
    }

    private static void ApplyRunRecord(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "RunRecord", out OpenApiSchema schema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(
            schema,
            "runId",
            "projectId",
            "createdUtc",
            "structuralExecutionMode");
    }

    private static void ApplyManifestSummaryResponse(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "ManifestSummaryResponse", out OpenApiSchema schema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(
            schema,
            "manifestId",
            "runId",
            "createdUtc",
            "manifestHash",
            "ruleSetId",
            "ruleSetVersion",
            "status",
            "decisionCount",
            "warningCount",
            "unresolvedIssueCount");
    }

    private static void ApplyArchitectureRequest(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "ArchitectureRequest", out OpenApiSchema schema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(
            schema,
            "assumptions",
            "constraints",
            "documents",
            "inlineRequirements",
            "infrastructureDeclarations",
            "policyReferences",
            "requiredCapabilities",
            "securityBaselineHints",
            "topologyHints");
    }

    private static void ApplyContextDocumentRequest(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "ContextDocumentRequest", out OpenApiSchema schema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(schema, "name", "contentType", "content");

        OpenApiSchemaContractMutator.SetDescriptionIfMissing(
            schema,
            "When present in ArchitectureRequest.documents[], name, contentType, and content are required by FluentValidation (empty arrays are allowed on the parent request).");
    }
}
