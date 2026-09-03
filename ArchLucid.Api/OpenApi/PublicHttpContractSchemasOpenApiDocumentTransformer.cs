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
        ApplyComparisonResult(document);
        ApplyCompareInputFingerprints(document);
        ApplyDecisionReceiptDocument(document);
        ApplyArchitectureRequest(document);
        ApplyContextDocumentRequest(document);
        ApplyProductFeedbackRequest(document);
        ApplyCorePilotChecklistPutRequest(document);

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

        if (schema.Properties is not null)
        {
            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedArchitectureVersionContentHashSha256",
                "Read-only SHA-256 κ artifact content hash pinned at run create (wave-9/10).");

            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedKnowledgeModelContentHashSha256",
                "Read-only SHA-256 κ model content hash pinned at run create (wave-10).");

            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedPolicyPackIdsJson",
                "Read-only create-time policy pack pin rows (JSON array) frozen at run create (wave-6+).");

            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedEvidencePackagePinsJson",
                "Read-only create-time evidence package pin rows (JSON array) frozen at run create (wave-6+).");

            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedFocusedPilotModeEnabled",
                "Read-only focused-pilot mode pin frozen at run create (wave-11).");

            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "pinnedFocusedPilotCloudProvider",
                "Read-only focused-pilot cloud provider pin frozen at run create (wave-11).");
        }
    }

    private static void SetPinHashDescriptionIfPresent(
        IDictionary<string, IOpenApiSchema> properties,
        string jsonName,
        string description)
    {
        if (properties.TryGetValue(jsonName, out IOpenApiSchema? propertySchema)
            && propertySchema is OpenApiSchema mutableProperty)
        {
            OpenApiSchemaContractMutator.SetDescriptionIfMissing(mutableProperty, description);
        }
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

        if (schema.Properties is not null)
        {
            SetPinHashDescriptionIfPresent(
                schema.Properties,
                "manifestHash",
                "Read-only SHA-256 over canonical committed manifest hash (Hasher A).");
        }
    }

    private static void ApplyComparisonResult(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "ComparisonResult", out OpenApiSchema schema))
            return;

        schema.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);
        OpenApiSchemaContractMutator.AddStringIfMissing(schema.Properties, "inputFingerprints");

        if (schema.Properties.TryGetValue("inputFingerprints", out IOpenApiSchema? fingerprintsSchema)
            && fingerprintsSchema is OpenApiSchema mutableFingerprints)
        {
            OpenApiSchemaContractMutator.SetDescriptionIfMissing(
                mutableFingerprints,
                "Wave-13/14/15: create-time pin, manifest hash, and committed artifact inventory fingerprints for both compare inputs.");
            mutableFingerprints.Type = JsonSchemaType.Object;
            mutableFingerprints.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);
            OpenApiSchemaContractMutator.AddStringIfMissing(mutableFingerprints.Properties, "comparisonAlgorithmVersion");
            OpenApiSchemaContractMutator.AddStringIfMissing(mutableFingerprints.Properties, "baseManifestHashSha256");
            OpenApiSchemaContractMutator.AddStringIfMissing(mutableFingerprints.Properties, "targetManifestHashSha256");
            OpenApiSchemaContractMutator.AddStringIfMissing(
                mutableFingerprints.Properties,
                "baseCommittedArtifactInventoryHashSha256");
            OpenApiSchemaContractMutator.AddStringIfMissing(
                mutableFingerprints.Properties,
                "targetCommittedArtifactInventoryHashSha256");
        }
    }

    private static void ApplyCompareInputFingerprints(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "CompareInputFingerprints", out OpenApiSchema schema))
            return;

        schema.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);
        OpenApiSchemaContractMutator.AddStringIfMissing(schema.Properties, "baseCommittedArtifactInventoryHashSha256");
        OpenApiSchemaContractMutator.AddStringIfMissing(schema.Properties, "targetCommittedArtifactInventoryHashSha256");
        OpenApiSchemaContractMutator.SetDescriptionIfMissing(
            schema,
            "Wave-15 suggestion 145: compare input fingerprints including committed artifact inventory rows.");
    }

    private static void ApplyDecisionReceiptDocument(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "DecisionReceiptDocument", out OpenApiSchema schema))
            return;

        schema.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        SetPinHashDescriptionIfPresent(
            schema.Properties,
            "manifestHashSha256",
            "Wave-13/14: SHA-256 over canonical committed manifest hash bound into the receipt.");

        SetPinHashDescriptionIfPresent(
            schema.Properties,
            "manifestVersion",
            "Committed golden manifest contract version bound into the receipt.");

        SetPinHashDescriptionIfMissing(
            schema.Properties,
            "receiptHashSha256",
            "Wave-15 suggestion 150: canonical SHA-256 over exportable receipt fields.");
    }

    private static void SetPinHashDescriptionIfMissing(
        IDictionary<string, IOpenApiSchema> properties,
        string jsonName,
        string description)
    {
        if (properties.TryGetValue(jsonName, out IOpenApiSchema? propertySchema)
            && propertySchema is OpenApiSchema mutableProperty)
        {
            OpenApiSchemaContractMutator.SetDescriptionIfMissing(mutableProperty, description);
        }
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

    private static void ApplyProductFeedbackRequest(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "ProductFeedbackRequest", out OpenApiSchema feedbackSchema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(feedbackSchema, "score");
        RemoveNullFromPropertySchema(feedbackSchema, "score");
    }

    private static void ApplyCorePilotChecklistPutRequest(OpenApiDocument document)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, "CorePilotChecklistPutRequest", out OpenApiSchema checklistSchema))
            return;

        OpenApiSchemaContractMutator.EnsureRequired(checklistSchema, "isCompleted");
        RemoveNullFromPropertySchema(checklistSchema, "isCompleted");
    }

    private static void RemoveNullFromPropertySchema(OpenApiSchema schema, string propertyName)
    {
        if (schema.Properties is null
            || !schema.Properties.TryGetValue(propertyName, out IOpenApiSchema? propertySchema)
            || propertySchema is not OpenApiSchema mutableProperty
            || !mutableProperty.Type.HasValue
            || !mutableProperty.Type.Value.HasFlag(JsonSchemaType.Null))
        {
            return;
        }

        mutableProperty.Type = mutableProperty.Type.Value & ~JsonSchemaType.Null;
    }
}
