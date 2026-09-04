using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AdvisoryTerraformRepresentationService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAdvisoryTerraformRepresentationRepository mappingRepository,
    ILogger<AdvisoryTerraformRepresentationService> logger) : IAdvisoryTerraformRepresentationService
{
    public async Task<AdvisoryTerraformRepresentationResult> TryBuildFromSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool aztfexportAvailable,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            AzureInventorySnapshotDetailReadModel? snapshot =
                await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

            if (snapshot is null)
            {
                return new AdvisoryTerraformRepresentationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Snapshot was not found in the current scope.",
                };
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
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Advisory Terraform representation build failed for SnapshotId={SnapshotId}.", snapshotId);

            return new AdvisoryTerraformRepresentationResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
