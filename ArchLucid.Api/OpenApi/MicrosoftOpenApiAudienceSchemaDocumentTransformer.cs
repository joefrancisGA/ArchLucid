using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Tags proof/buyer DTO schemas with <c>x-archlucid-audience: buyer</c> in the OpenAPI document (TB-286).
/// </summary>
public sealed class MicrosoftOpenApiAudienceSchemaDocumentTransformer : IOpenApiDocumentTransformer
{
    private static readonly string[] BuyerProofSchemaNames =
    [
        "PilotRunDeltasResponse",
        "SponsorRoiSummaryResponse",
        "SponsorOrphanCandidateSummary",
        "BuyerRunDetailSummaryDto",
        "BuyerRunDetailRunDto",
        "RunExplanationSummary",
    ];

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (document.Components?.Schemas is null)
            return Task.CompletedTask;

        foreach (string schemaName in BuyerProofSchemaNames)
        {
            if (!document.Components.Schemas.TryGetValue(schemaName, out IOpenApiSchema? schema)
                || schema is not OpenApiSchema mutable)
                continue;

            OpenApiAudienceExtensionMutator.SetAudience(mutable, OpenApiAudience.Buyer);
        }

        if (document.Components.Schemas.TryGetValue("AgentExecutionTrace", out IOpenApiSchema? traceSchema)
            && traceSchema is OpenApiSchema mutableTrace)
            OpenApiAudienceExtensionMutator.SetAudience(mutableTrace, OpenApiAudience.Forensics);

        return Task.CompletedTask;
    }
}
