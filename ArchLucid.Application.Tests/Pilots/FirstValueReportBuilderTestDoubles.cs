using ArchLucid.Application.Roi;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

internal static class FirstValueReportBuilderTestDoubles
{
    internal static RoiCostEvidenceCollectionResolver CreateDefaultCostEvidenceResolver()
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();

        return RoiCostEvidenceCollectionResolverTestSupport.Create(azureRepository.Object, cloudRepository.Object);
    }

    internal static IOptions<RoiCostEvidenceFreshnessOptions> CreateDefaultFreshnessOptions() =>
        Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 });

    internal static IGraphSnapshotRepository CreateGraphSnapshotRepository() =>
        Mock.Of<IGraphSnapshotRepository>();

    internal static IAgentExecutionTraceRepository CreateEmptyAgentExecutionTraceRepository() =>
        SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository();

    internal static IManifestHashService CreateManifestHashService() =>
        SealedExportReceiptTestSupport.CreateManifestHashService();

    internal static IAuthorityQueryService CreateAuthorityQueryForSponsorExport(IManifestHashService? hashes = null) =>
        SealedExportReceiptTestSupport.CreateAuthorityQueryServiceForAnyExportRun(hashes);

    /// <summary>
    ///     Host config that satisfies career-export honesty for Real-mode sponsor PDF tests:
    ///     pre-commit gate on, PilotStrict quality gate, Real execution.
    /// </summary>
    internal static Dictionary<string, string?> CreateCareerCompleteRealModeHonestyValues(
        string? azureOpenAiDeploymentName = "gpt-test")
    {
        return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:DeploymentName"] = azureOpenAiDeploymentName,
            [$"{PreCommitGovernanceGateOptions.SectionPath}:{nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled)}"] = "true",
            [$"{AgentOutputQualityGateOptions.SectionPath}:{nameof(AgentOutputQualityGateOptions.Mode)}"] =
                AgentOutputQualityGateMode.PilotStrict.ToString(),
        };
    }
}
