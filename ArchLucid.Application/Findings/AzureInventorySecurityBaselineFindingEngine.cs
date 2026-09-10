using ArchLucid.Contracts.Architecture;
using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic security-baseline findings from scoped Azure extractor ZIP (TB-2210).</summary>
public sealed class AzureInventorySecurityBaselineFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository packageRepository,
    IComplianceRulePackProvider rulePackProvider,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    public string EngineType => "azure-inventory-security-baseline";

    public string Category => "Security";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForAzure(
                analysisContext,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return [];
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        AzureExtractorPackageDownloadRecord? download =
            await EffectfulFindingEngineEvidenceLoader.TryResolveAzureDownloadAsync(
                _packageRepository,
                scope,
                analysisContext,
                ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return [];
        }

        string? resourcesJson = AzureInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return [];
        }

        ComplianceRulePack rulePack = await _rulePackProvider.GetRulePackAsync(ct).ConfigureAwait(false);
        HashSet<string> activeRuleIds = DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(rulePack);

        IReadOnlyList<InventorySecurityBaselineFinding> gaps =
            AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        InventoryTopologyResourceNodeIndex topologyNodes =
            InventoryTopologyResourceNodeIndex.Build(graphSnapshot, InventoryTopologyCloudProvider.Azure);

        List<Finding> findings = [];

        foreach (InventorySecurityBaselineFinding gap in gaps)
        {
            if (!DeclarationSignalPolicyGate.ShouldEmitTheme(gap.ControlFamily, activeRuleIds))
                continue;

            string? policyRuleId = DeclarationSignalPolicyGate.TryGetPolicyRuleId(gap.ControlFamily, activeRuleIds);

            findings.Add(InventorySecurityBaselineFindingMapper.ToFinding(
                gap,
                EngineType,
                "AzureInventorySecurityBaseline",
                "Azure",
                topologyNodes,
                policyRuleId));
        }

        return findings;
    }
}
