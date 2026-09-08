using ArchLucid.Application.Findings;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Loads inventory and emits prose-assumption contradiction findings (DX-55, DX-61 register).</summary>
public interface IProseAssumptionContradictionService
{
    Task<ProseAssumptionContradictionOutcome> EmitOutcomeAsync(
        IReadOnlyList<ProseAssumptionCandidate> candidates,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        int maxFindings,
        int maxRegisterEntries,
        CancellationToken cancellationToken);
}

public sealed class ProseAssumptionContradictionService(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository azurePackageRepository,
    ICloudInventoryExtractorPackageRepository cloudPackageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IProseAssumptionContradictionService
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

    public async Task<ProseAssumptionContradictionOutcome> EmitOutcomeAsync(
        IReadOnlyList<ProseAssumptionCandidate> candidates,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        int maxFindings,
        int maxRegisterEntries,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (candidates.Count == 0 || (maxFindings <= 0 && maxRegisterEntries <= 0))
            return ProseAssumptionContradictionOutcome.Empty;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<ProseAssumptionInventorySlice> inventorySlices = [];
        List<ProseAssumptionContradictionMatch> matches = [];

        if (!EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForAzure(
                analysisContext,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            string? azureResourcesJson = await TryReadAzureResourcesJsonAsync(scope, analysisContext, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(azureResourcesJson))
            {
                inventorySlices.Add(new ProseAssumptionInventorySlice
                {
                    CloudProvider = InventoryTopologyCloudProvider.Azure,
                    ResourcesJson = azureResourcesJson,
                });

                matches.AddRange(
                    ProseAssumptionContradictionPass.Analyze(
                        InventoryTopologyCloudProvider.Azure,
                        azureResourcesJson,
                        graphSnapshot,
                        candidates,
                        maxFindings));
            }
        }

        await AppendCloudInventoryAsync(
            inventorySlices,
            matches,
            graphSnapshot,
            candidates,
            analysisContext,
            scope,
            CloudProvider.Aws,
            InventoryTopologyCloudProvider.Aws,
            maxFindings,
            cancellationToken).ConfigureAwait(false);

        await AppendCloudInventoryAsync(
            inventorySlices,
            matches,
            graphSnapshot,
            candidates,
            analysisContext,
            scope,
            CloudProvider.Gcp,
            InventoryTopologyCloudProvider.Gcp,
            maxFindings,
            cancellationToken).ConfigureAwait(false);

        List<Finding> findings = [];

        foreach (ProseAssumptionContradictionMatch match in matches
                     .OrderBy(static match => match.ResourceLabel, StringComparer.OrdinalIgnoreCase)
                     .ThenBy(static match => match.Candidate.DocumentPath, StringComparer.OrdinalIgnoreCase)
                     .ThenBy(static match => match.Candidate.LineNumber))
        {
            if (findings.Count >= maxFindings)
                break;

            findings.Add(ProseAssumptionContradictionFindingEmitter.ToFinding(match));
        }

        IReadOnlyList<ProseAssumptionRegisterEntry> registerEntries = ProseAssumptionRegisterBuilder.Build(
            candidates,
            graphSnapshot,
            inventorySlices,
            matches,
            findings,
            maxRegisterEntries);

        return new ProseAssumptionContradictionOutcome(findings, registerEntries);
    }

    private async Task AppendCloudInventoryAsync(
        List<ProseAssumptionInventorySlice> inventorySlices,
        List<ProseAssumptionContradictionMatch> matches,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<ProseAssumptionCandidate> candidates,
        FindingAnalysisContext? analysisContext,
        ScopeContext scope,
        CloudProvider cloudProvider,
        InventoryTopologyCloudProvider inventoryCloudProvider,
        int maxFindings,
        CancellationToken cancellationToken)
    {
        if (matches.Count >= maxFindings)
            return;

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

        string? resourcesJson = await TryReadCloudResourcesJsonAsync(scope, cloudProvider, analysisContext, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(resourcesJson))
            return;

        inventorySlices.Add(new ProseAssumptionInventorySlice
        {
            CloudProvider = inventoryCloudProvider,
            ResourcesJson = resourcesJson,
        });

        int remaining = maxFindings - matches.Count;

        matches.AddRange(
            ProseAssumptionContradictionPass.Analyze(
                inventoryCloudProvider,
                resourcesJson,
                graphSnapshot,
                candidates,
                remaining));
    }

    private async Task<string?> TryReadAzureResourcesJsonAsync(
        ScopeContext scope,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        AzureExtractorPackageDownloadRecord? download;

        try
        {
            download = await EffectfulFindingEngineEvidenceLoader.TryResolveAzureDownloadAsync(
                _azurePackageRepository,
                scope,
                analysisContext,
                cancellationToken).ConfigureAwait(false);
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
        CancellationToken cancellationToken)
    {
        CloudInventoryExtractorPackageDownloadRecord? download;

        try
        {
            download = await EffectfulFindingEngineEvidenceLoader.TryResolveCloudDownloadAsync(
                _cloudPackageRepository,
                scope,
                cloudProvider,
                analysisContext,
                cancellationToken).ConfigureAwait(false);
        }
        catch (ConflictException)
        {
            return null;
        }

        if (download is null || download.PackageBytes.Length == 0)
            return null;

        return CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);
    }
}
