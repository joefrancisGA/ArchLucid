using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>Default JSON body for architecture analysis report export endpoints.</summary>
internal static class HarnessAnalysisReportRequestFactory
{
    internal static object CreateDefaultIncludeAllBody() =>
        new
        {
            includeEvidence = true,
            includeExecutionTraces = true,
            includeManifest = true,
            includeDiagram = true,
            includeSummary = true,
            includeDeterminismCheck = false,
            determinismIterations = 3,
            includeManifestCompare = false,
            compareManifestVersion = (string?)null,
            includeAgentResultCompare = false,
            compareRunId = (string?)null,
        };

    internal static HttpContent CreateDefaultJsonContent(JsonSerializerOptions jsonOptions) =>
        IntegrationTestHttpContent.CreateJson(CreateDefaultIncludeAllBody(), jsonOptions);
}
