using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ArchiForge.Api.Swagger;

public sealed class ReplayExamplesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (operation.RequestBody?.Content == null) return;

        var path = context.ApiDescription.RelativePath ?? "";
        if (!path.Contains("comparisons", StringComparison.OrdinalIgnoreCase) || !path.Contains("replay", StringComparison.OrdinalIgnoreCase))
            return;

        if (!operation.RequestBody.Content.TryGetValue("application/json", out var mediaType))
            return;

        // Describe replay request examples (Example/Examples use IOpenApiAny and vary by Microsoft.OpenApi version)
        operation.Summary ??= "Replay a persisted comparison";
        if (string.IsNullOrWhiteSpace(operation.Description))
        {
            operation.Description = "Replay examples: "
                + "artifact-markdown: format=markdown, replayMode=artifact, persistReplay=false. "
                + "verify-persist: format=markdown, replayMode=verify, profile=detailed, persistReplay=true. "
                + "docx-executive: format=docx, replayMode=artifact, profile=executive, persistReplay=false.";
        }
    }
}
