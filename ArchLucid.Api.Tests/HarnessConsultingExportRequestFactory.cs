namespace ArchLucid.Api.Tests;

/// <summary>Consulting docx export bodies for export-record diff scenarios.</summary>
internal static class HarnessConsultingExportRequestFactory
{
    internal static object CreateExecutiveSponsorBody() =>
        new
        {
            templateProfile = "sponsor",
            audience = "Executives",
            externalDelivery = true,
            executiveFriendly = true,
            regulatedEnvironment = false,
            needDetailedEvidence = false,
            needExecutionTraces = false,
            needDeterminismOrCompareAppendices = false,
            includeEvidence = true,
            includeExecutionTraces = false,
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

    internal static object CreateInternalArchitectBody() =>
        new
        {
            templateProfile = "internal",
            audience = "Internal architects",
            externalDelivery = false,
            executiveFriendly = false,
            regulatedEnvironment = false,
            needDetailedEvidence = true,
            needExecutionTraces = true,
            needDeterminismOrCompareAppendices = true,
            includeEvidence = true,
            includeExecutionTraces = true,
            includeManifest = true,
            includeDiagram = true,
            includeSummary = true,
            includeDeterminismCheck = true,
            determinismIterations = 3,
            includeManifestCompare = false,
            compareManifestVersion = (string?)null,
            includeAgentResultCompare = false,
            compareRunId = (string?)null,
        };
}
