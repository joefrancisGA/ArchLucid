using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
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

/// <summary>
///     Emits one finding per security-relevant declaration vs inventory property mismatch (DX-04).
/// </summary>
public sealed class DeclarationInventoryContradictionFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository azurePackageRepository,
    ICloudInventoryExtractorPackageRepository cloudPackageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions,
    IComplianceRulePackProvider? rulePackProvider = null) : IEffectfulFindingEngine
{
    internal const int MaxFindingsPerSnapshot = 25;

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorPackageRepository _azurePackageRepository =
        azurePackageRepository ?? throw new ArgumentNullException(nameof(azurePackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudPackageRepository =
        cloudPackageRepository ?? throw new ArgumentNullException(nameof(cloudPackageRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    private readonly IComplianceRulePackProvider? _rulePackProvider = rulePackProvider;

    public string EngineType => "declaration-inventory-contradiction";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        HashSet<string> activeRuleIds = await ResolveActiveRuleIdsAsync(ct).ConfigureAwait(false);

        List<DeclarationInventoryContradictionMismatch> mismatches = [];

        if (!EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForAzure(
                analysisContext,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            string? azureResourcesJson = await TryReadAzureResourcesJsonAsync(scope, analysisContext, ct).ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(azureResourcesJson))
            {
                mismatches.AddRange(
                    DeclarationInventoryContradictionAnalyzer.Analyze(
                        InventoryTopologyCloudProvider.Azure,
                        azureResourcesJson,
                        graphSnapshot));
            }
        }

        await AppendCloudMismatchesAsync(
            mismatches,
            graphSnapshot,
            analysisContext,
            scope,
            CloudProvider.Aws,
            InventoryTopologyCloudProvider.Aws,
            ct).ConfigureAwait(false);

        await AppendCloudMismatchesAsync(
            mismatches,
            graphSnapshot,
            analysisContext,
            scope,
            CloudProvider.Gcp,
            InventoryTopologyCloudProvider.Gcp,
            ct).ConfigureAwait(false);

        if (mismatches.Count == 0)
            return [];

        List<Finding> findings = [];
        bool truncated = false;

        foreach (DeclarationInventoryContradictionMismatch mismatch in mismatches
                     .OrderBy(static mismatch => mismatch.ResourceLabel, StringComparer.OrdinalIgnoreCase)
                     .ThenBy(static mismatch => mismatch.DeclarationKey, StringComparer.OrdinalIgnoreCase))
        {
            if (findings.Count >= MaxFindingsPerSnapshot)
            {
                truncated = true;
                break;
            }

            string? policyRuleId = DeclarationSignalPolicyKeyMap.TryGetFirstMappedRuleId(
                mismatch.SecurityTheme,
                activeRuleIds);

            findings.Add(DeclarationInventoryContradictionFindingMapper.ToFinding(mismatch, policyRuleId));
        }

        if (truncated)
        {
            findings[^1].Trace.Notes.Add(
                $"Truncated at {MaxFindingsPerSnapshot} declaration-inventory-contradiction findings for this snapshot.");
        }

        return findings;
    }

    private async Task AppendCloudMismatchesAsync(
        List<DeclarationInventoryContradictionMismatch> mismatches,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        ScopeContext scope,
        CloudProvider cloudProvider,
        InventoryTopologyCloudProvider inventoryCloudProvider,
        CancellationToken ct)
    {
        if (!EffectfulFindingEngineCollectionFreshness.TryGetPinnedCollectionUtc(
                analysisContext,
                cloudProvider,
                out DateTime collectionUtc))
        {
            return;
        }

        if (InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
                collectionUtc,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return;
        }

        string? resourcesJson = await TryReadCloudResourcesJsonAsync(scope, cloudProvider, analysisContext, ct)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(resourcesJson))
            return;

        mismatches.AddRange(
            DeclarationInventoryContradictionAnalyzer.Analyze(
                inventoryCloudProvider,
                resourcesJson,
                graphSnapshot));
    }

    private async Task<string?> TryReadAzureResourcesJsonAsync(
        ScopeContext scope,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        AzureExtractorPackageDownloadRecord? download;

        try
        {
            download = await EffectfulFindingEngineEvidenceLoader.TryResolveAzureDownloadAsync(
                _azurePackageRepository,
                scope,
                analysisContext,
                ct).ConfigureAwait(false);
        }
        catch (ConflictException)
        {
            return null;
        }

        if (download is null || download.PackageBytes.Length == 0)
            return null;

        return AzureInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);
    }

    private async Task<string?> TryReadCloudResourcesJsonAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        CloudInventoryExtractorPackageDownloadRecord? download;

        try
        {
            download = await EffectfulFindingEngineEvidenceLoader.TryResolveCloudDownloadAsync(
                _cloudPackageRepository,
                scope,
                cloudProvider,
                analysisContext,
                ct).ConfigureAwait(false);
        }
        catch (ConflictException)
        {
            return null;
        }

        if (download is null || download.PackageBytes.Length == 0)
            return null;

        return CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);
    }

    private async Task<HashSet<string>> ResolveActiveRuleIdsAsync(CancellationToken ct)
    {
        if (_rulePackProvider is null)
            return [];

        ComplianceRulePack rulePack = await _rulePackProvider.GetRulePackAsync(ct).ConfigureAwait(false);
        return DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(rulePack);
    }
}
