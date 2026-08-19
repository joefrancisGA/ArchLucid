using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Seeds Technology Ledger rows with <see cref="TechnologyLedgerSource.Evidence" /> from IaC declarations and
///     cloud inventory packages linked to a run.
/// </summary>
public sealed class TechnologyLedgerEvidenceSeeder(
    ITechnologyLedgerRepository technologyLedgerRepository,
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackageRepository,
    IConnectorNormalizer<InfrastructureDeclarationsPayload> infrastructureDeclarationsNormalizer,
    TimeProvider timeProvider)
{
    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudInventoryExtractorPackageRepository =
        cloudInventoryExtractorPackageRepository
        ?? throw new ArgumentNullException(nameof(cloudInventoryExtractorPackageRepository));

    private readonly IConnectorNormalizer<InfrastructureDeclarationsPayload> _infrastructureDeclarationsNormalizer =
        infrastructureDeclarationsNormalizer ?? throw new ArgumentNullException(nameof(infrastructureDeclarationsNormalizer));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <summary>Persists evidence-sourced ledger entries for the run when grounding exists.</summary>
    public async Task SeedAsync(string runId, ArchitectureRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TechnologyLedgerEntry> existing =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        List<TechnologyLedgerEntry> working = existing.ToList();
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        List<TechnologyLedgerEntry> candidates = [];

        candidates.AddRange(await BuildInfrastructureDeclarationCandidatesAsync(request, runId, utcNow, cancellationToken));

        if (TryParseRunGuid(runId, out Guid runGuid))
            candidates.AddRange(await BuildInventoryCandidatesAsync(scope, runGuid, runId, utcNow, cancellationToken));

        foreach (TechnologyLedgerEntry candidate in candidates)
        {
            TechnologyLedgerEntry? resolved = TechnologyLedgerEvidenceMergePolicy.Resolve(candidate, working);

            if (resolved is null)
                continue;

            await _technologyLedgerRepository.AddAsync(resolved, cancellationToken);
            working.Add(resolved);
        }
    }

    private async Task<List<TechnologyLedgerEntry>> BuildInfrastructureDeclarationCandidatesAsync(
        ArchitectureRequest request,
        string runId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        List<TechnologyLedgerEntry> candidates = [];

        if (request.InfrastructureDeclarations.Count == 0)
            return candidates;

        InfrastructureDeclarationsPayload payload = BuildInfrastructureDeclarationsPayload(request);

        foreach (InfrastructureDeclarationReference declaration in payload.InfrastructureDeclarations)
        {
            candidates.Add(
                TechnologyLedgerCanonicalObjectMapper.BuildIacTargetEntry(
                    declaration.Format,
                    declaration.DeclarationId,
                    declaration.Name,
                    runId,
                    utcNow));
        }

        NormalizedContextBatch batch = await _infrastructureDeclarationsNormalizer.NormalizeAsync(payload, cancellationToken);

        foreach (CanonicalObject canonicalObject in batch.CanonicalObjects)
        {
            IReadOnlyList<TechnologyLedgerEntry> mapped =
                TechnologyLedgerCanonicalObjectMapper.MapCanonicalObject(canonicalObject, runId, utcNow);

            candidates.AddRange(mapped);
        }

        return candidates;
    }

    private async Task<List<TechnologyLedgerEntry>> BuildInventoryCandidatesAsync(
        ScopeContext scope,
        Guid runGuid,
        string runId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        List<TechnologyLedgerEntry> candidates = [];

        AzureExtractorPackageProvenance? azureProvenance =
            await _azureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(scope, runGuid, cancellationToken);

        if (azureProvenance is not null)
        {
            candidates.Add(
                TechnologyLedgerCanonicalObjectMapper.BuildAzureInventoryCloudPlatformEntry(
                    azureProvenance.PackageId,
                    azureProvenance.OriginalFileName,
                    runId,
                    utcNow));
        }

        CloudInventoryExtractorPackageProvenance? awsProvenance =
            await _cloudInventoryExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(
                scope,
                runGuid,
                CloudProvider.Aws,
                cancellationToken);

        if (awsProvenance is not null)
        {
            candidates.Add(
                TechnologyLedgerCanonicalObjectMapper.BuildCloudInventoryCloudPlatformEntry(
                    CloudProvider.Aws,
                    awsProvenance.PackageId,
                    awsProvenance.OriginalFileName,
                    runId,
                    utcNow));
        }

        CloudInventoryExtractorPackageProvenance? gcpProvenance =
            await _cloudInventoryExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(
                scope,
                runGuid,
                CloudProvider.Gcp,
                cancellationToken);

        if (gcpProvenance is not null)
        {
            candidates.Add(
                TechnologyLedgerCanonicalObjectMapper.BuildCloudInventoryCloudPlatformEntry(
                    CloudProvider.Gcp,
                    gcpProvenance.PackageId,
                    gcpProvenance.OriginalFileName,
                    runId,
                    utcNow));
        }

        return candidates;
    }

    private static InfrastructureDeclarationsPayload BuildInfrastructureDeclarationsPayload(ArchitectureRequest request)
    {
        return new InfrastructureDeclarationsPayload
        {
            InfrastructureDeclarations = request.InfrastructureDeclarations
                .Select(declaration => new InfrastructureDeclarationReference
                {
                    Name = declaration.Name,
                    Format = declaration.Format,
                    Content = declaration.Content,
                })
                .ToList(),
        };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
