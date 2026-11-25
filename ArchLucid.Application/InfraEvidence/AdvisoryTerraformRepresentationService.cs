using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AdvisoryTerraformRepresentationService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAdvisoryTerraformRepresentationRepository mappingRepository,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AdvisoryTerraformRepresentationService> logger,
    IInfraEvidenceRunReadAccess? runReadAccess = null) : IAdvisoryTerraformRepresentationService
{
    public Task<AdvisoryTerraformRepresentationResult> TryBuildFromSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool aztfexportAvailable,
        CancellationToken cancellationToken = default) =>
        BuildAsync(scope, snapshotId, aztfexportAvailable, callerExport: false, cancellationToken);

    public Task<AdvisoryTerraformRepresentationResult> TryBuildForSnapshotExportAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        BuildAsync(scope, snapshotId, aztfexportAvailable: false, callerExport: true, cancellationToken);

    private async Task<AdvisoryTerraformRepresentationResult> BuildAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool aztfexportAvailable,
        bool callerExport,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            if (callerExport)
            {
                if (snapshotId == Guid.Empty
                    || await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken) is null)
                {
                    return SnapshotNotFound();
                }

                await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                    scope,
                    snapshotId,
                    reconciliationRepository,
                    authorityQueryService,
                    manifestHashService,
                    (runId, ct) => runReadAccess?.CanReadRunAsync(scope, runId, ct) ?? Task.FromResult(false),
                    cancellationToken);
            }
            else
            {
                // Keep the remediation execution caller's existing seal behavior.
                await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                    scope,
                    snapshotId,
                    reconciliationRepository,
                    authorityQueryService,
                    manifestHashService,
                    cancellationToken);
            }

            AzureInventorySnapshotDetailReadModel? snapshot =
                await snapshotRepository.TryGetAdvisoryTerraformVisibleSnapshotAsync(scope, snapshotId, cancellationToken);

            if (snapshot is null)
            {
                return SnapshotNotFound();
            }

            AdvisoryTerraformBuildResult build =
                AdvisoryTerraformRepresentationBuilder.Build(snapshot, aztfexportAvailable);

            await mappingRepository.ReplaceMappingsAsync(scope, snapshotId, build.Mappings, cancellationToken);

            return new AdvisoryTerraformRepresentationResult
            {
                Succeeded = true,
                SnapshotId = snapshotId,
                ContentHashSha256 = build.ContentHashSha256,
                Mappings = build.Mappings,
                Files = build.Files,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not ConflictException)
        {
            logger.LogWarning(ex, "Advisory Terraform representation build failed for SnapshotId={SnapshotId}.", snapshotId);

            return new AdvisoryTerraformRepresentationResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    private static AdvisoryTerraformRepresentationResult SnapshotNotFound() => new()
    {
        Succeeded = false,
        ErrorMessage = "Snapshot was not found in the current scope.",
    };
}
