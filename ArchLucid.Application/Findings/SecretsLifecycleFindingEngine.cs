using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Inventory-backed secret rotation/expiry findings when stale secrets are referenced on the graph (DX-09).
/// </summary>
public sealed class SecretsLifecycleFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository azurePackageRepository,
    ICloudInventoryExtractorPackageRepository cloudPackageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorPackageRepository _azurePackageRepository =
        azurePackageRepository ?? throw new ArgumentNullException(nameof(azurePackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudPackageRepository =
        cloudPackageRepository ?? throw new ArgumentNullException(nameof(cloudPackageRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    public string EngineType => "secrets-lifecycle";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        DateTimeOffset utcNow = _clock.GetUtcNow();
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<Finding> findings = [];

        await CollectAzureFindingsAsync(graphSnapshot, analysisContext, scope, utcNow, findings, ct).ConfigureAwait(false);
        await CollectCloudFindingsAsync(
            graphSnapshot,
            analysisContext,
            scope,
            CloudProvider.Aws,
            "Aws",
            utcNow,
            findings,
            ct).ConfigureAwait(false);
        await CollectCloudFindingsAsync(
            graphSnapshot,
            analysisContext,
            scope,
            CloudProvider.Gcp,
            "Gcp",
            utcNow,
            findings,
            ct).ConfigureAwait(false);

        return findings
            .Take(SecretsLifecycleThresholds.MaxFindings)
            .ToList();
    }

    private async Task CollectAzureFindingsAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        ScopeContext scope,
        DateTimeOffset utcNow,
        List<Finding> findings,
        CancellationToken ct)
    {
        if (ShouldSkipInventoryProvider(analysisContext, RunEvidencePackagePinService.AzureProvider, utcNow.UtcDateTime))
        {
            return;
        }

        AzureExtractorPackageDownloadRecord? download =
            await TryResolveAzureDownloadOrNullAsync(scope, analysisContext, ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return;
        }

        string? resourcesJson = AzureInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return;
        }

        InventoryTopologyResourceNodeIndex topologyNodes =
            InventoryTopologyResourceNodeIndex.Build(graphSnapshot, InventoryTopologyCloudProvider.Azure);

        AppendFindingsForRows(
            graphSnapshot,
            topologyNodes,
            SecretsLifecycleInventoryParser.ParseFromResourcesJson(resourcesJson, "Azure"),
            utcNow,
            findings);
    }

    private async Task CollectCloudFindingsAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        ScopeContext scope,
        CloudProvider cloudProvider,
        string cloudLabel,
        DateTimeOffset utcNow,
        List<Finding> findings,
        CancellationToken ct)
    {
        string pinProvider = cloudProvider switch
        {
            CloudProvider.Aws => RunEvidencePackagePinService.AwsProvider,
            CloudProvider.Gcp => RunEvidencePackagePinService.GcpProvider,
            _ => cloudProvider.ToString().ToLowerInvariant(),
        };

        if (ShouldSkipInventoryProvider(analysisContext, pinProvider, utcNow.UtcDateTime))
        {
            return;
        }

        CloudInventoryExtractorPackageDownloadRecord? download =
            await TryResolveCloudDownloadOrNullAsync(scope, cloudProvider, analysisContext, ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return;
        }

        string? resourcesJson = CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return;
        }

        InventoryTopologyCloudProvider topologyCloud = cloudProvider switch
        {
            CloudProvider.Aws => InventoryTopologyCloudProvider.Aws,
            CloudProvider.Gcp => InventoryTopologyCloudProvider.Gcp,
            _ => InventoryTopologyCloudProvider.Aws,
        };

        InventoryTopologyResourceNodeIndex topologyNodes =
            InventoryTopologyResourceNodeIndex.Build(graphSnapshot, topologyCloud);

        AppendFindingsForRows(
            graphSnapshot,
            topologyNodes,
            SecretsLifecycleInventoryParser.ParseFromResourcesJson(resourcesJson, cloudLabel),
            utcNow,
            findings);
    }

    private void AppendFindingsForRows(
        GraphSnapshot graphSnapshot,
        InventoryTopologyResourceNodeIndex topologyNodes,
        IReadOnlyList<SecretsLifecycleInventoryRow> rows,
        DateTimeOffset utcNow,
        List<Finding> findings)
    {
        foreach (SecretsLifecycleInventoryRow row in rows)
        {
            if (findings.Count >= SecretsLifecycleThresholds.MaxFindings)
            {
                return;
            }

            SecretsLifecycleStaleEvaluator.EvaluationResult evaluation = SecretsLifecycleStaleEvaluator.Evaluate(
                row,
                utcNow,
                SecretsLifecycleThresholds.StaleRotationDays,
                SecretsLifecycleThresholds.ExpiryWarningDays);

            if (!evaluation.ShouldEmit)
            {
                continue;
            }

            SecretsLifecycleGraphMatcher.MatchResult graphMatch =
                SecretsLifecycleGraphMatcher.TryMatch(graphSnapshot, row.SecretName, row.VaultName);

            if (!graphMatch.IsReferenced)
            {
                continue;
            }

            IReadOnlyList<string> relatedNodeIds = topologyNodes.Resolve(row.InventoryResourceId);

            if (relatedNodeIds.Count == 0 && !string.IsNullOrWhiteSpace(graphMatch.MatchedNodeId))
            {
                relatedNodeIds = [graphMatch.MatchedNodeId!];
            }

            findings.Add(BuildFinding(row, evaluation.DaysStale, relatedNodeIds, graphMatch.MatchedNodeId));
        }
    }

    private static Finding BuildFinding(
        SecretsLifecycleInventoryRow row,
        int daysStale,
        IReadOnlyList<string> relatedNodeIds,
        string? matchedNodeId)
    {
        string vaultLabel = string.IsNullOrWhiteSpace(row.VaultName) ? "vault" : row.VaultName;

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "SecretsLifecycleFinding",
            Category = "Security",
            EngineType = "secrets-lifecycle",
            Severity = FindingSeverity.Warning,
            Title = $"Stale secret rotation: {row.SecretName} in {vaultLabel}",
            Rationale =
                "Inventory shows the secret was last rotated or updated beyond the rotation threshold, or expiry is imminent, and the current graph references this vault or secret.",
            RelatedNodeIds = relatedNodeIds.ToList(),
            PayloadType = nameof(SecretsLifecycleFindingPayload),
            Payload = new SecretsLifecycleFindingPayload
            {
                SecretName = row.SecretName,
                VaultName = row.VaultName,
                LastRotatedUtc = row.LastRotatedUtc,
                DaysStale = daysStale,
                Cloud = row.Cloud,
            },
            RecommendedActions =
            [
                "Rotate the secret in the cloud vault and update dependent application references.",
                "Record the rotation in governance if a waiver or deferral applies.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = matchedNodeId is null ? [] : [matchedNodeId],
                RulesApplied = ["secrets-lifecycle-inventory-rotation"],
                DecisionsTaken =
                [
                    "Matched inventory secret rows to graph references before emitting rotation findings.",
                ],
                AlternativePathsConsidered =
                [
                    "Rotate the secret immediately when expiry is within the warning window.",
                    "Dismiss when the secret is intentionally long-lived and governed by an approved exception.",
                ],
                Notes =
                [
                    $"evidence:{row.InventoryResourceId}",
                    $"Cloud: {row.Cloud}",
                    $"Days stale: {daysStale}",
                    row.LastRotatedUtc is null
                        ? "Last rotated: not reported in inventory row."
                        : $"Last rotated (UTC): {row.LastRotatedUtc:O}",
                    row.ExpiryUtc is null
                        ? "Expiry: not reported in inventory row."
                        : $"Expiry (UTC): {row.ExpiryUtc:O}",
                ],
            },
        };
    }

    private async Task<AzureExtractorPackageDownloadRecord?> TryResolveAzureDownloadOrNullAsync(
        ScopeContext scope,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        try
        {
            return await EffectfulFindingEngineEvidenceLoader.TryResolveAzureDownloadAsync(
                _azurePackageRepository,
                scope,
                analysisContext,
                ct).ConfigureAwait(false);
        }
        catch (ConflictException)
        {
            return null;
        }
    }

    private async Task<CloudInventoryExtractorPackageDownloadRecord?> TryResolveCloudDownloadOrNullAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        try
        {
            return await EffectfulFindingEngineEvidenceLoader.TryResolveCloudDownloadAsync(
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
    }

    private bool ShouldSkipInventoryProvider(
        FindingAnalysisContext? analysisContext,
        string provider,
        DateTime utcNow)
    {
        try
        {
            if (string.Equals(provider, RunEvidencePackagePinService.AzureProvider, StringComparison.OrdinalIgnoreCase))
            {
                return EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForAzure(
                    analysisContext,
                    utcNow,
                    _freshnessOptions.StaleAfterDays);
            }

            CloudProvider cloudProvider = provider switch
            {
                var value when string.Equals(value, RunEvidencePackagePinService.AwsProvider, StringComparison.OrdinalIgnoreCase)
                    => CloudProvider.Aws,
                var value when string.Equals(value, RunEvidencePackagePinService.GcpProvider, StringComparison.OrdinalIgnoreCase)
                    => CloudProvider.Gcp,
                _ => CloudProvider.Aws,
            };

            return EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForCloud(
                analysisContext,
                cloudProvider,
                utcNow,
                _freshnessOptions.StaleAfterDays);
        }
        catch (ConflictException)
        {
            return true;
        }
    }
}
