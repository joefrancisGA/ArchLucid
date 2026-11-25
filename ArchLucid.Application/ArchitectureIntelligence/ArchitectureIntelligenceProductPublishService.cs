using System.Text.Json;

using ArchLucid.Application.InfraEvidence;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Publishes gated ArchitectureIntelligence product DTOs into existing findings/advisory stores.
/// </summary>
public sealed class ArchitectureIntelligenceProductPublishService : IArchitectureIntelligenceProductPublishService
{
    internal const string InventoryVerificationProperty = "architectureIntelligence.independentInventoryVerification";

    internal const string StorageTlsVerificationProperty = "architectureIntelligence.independentStorageTlsVerification";

    private readonly IFindingsSnapshotRepository? _findingsSnapshotRepository;
    private readonly IRecommendationRepository? _recommendationRepository;
    private readonly IRunRepository? _runRepository;
    private readonly ScopedPublicNetworkAccessVerifier? _publicNetworkAccessVerifier;

    public ArchitectureIntelligenceProductPublishService(IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        _findingsSnapshotRepository = serviceProvider.GetService<IFindingsSnapshotRepository>();
        _recommendationRepository = serviceProvider.GetService<IRecommendationRepository>();
        _runRepository = serviceProvider.GetService<IRunRepository>();
        _publicNetworkAccessVerifier = serviceProvider.GetService<ScopedPublicNetworkAccessVerifier>();
    }

    public async Task<ArchitectureIntelligencePublishResult> PublishAsync(
        ClosedLoopReasoningResult result,
        string tenantId,
        string workspaceId,
        string projectId,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (string.IsNullOrWhiteSpace(tenantId)
            || string.IsNullOrWhiteSpace(workspaceId)
            || string.IsNullOrWhiteSpace(projectId)
            || string.IsNullOrWhiteSpace(runId))
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = "TenantId, WorkspaceId, ProjectId, and RunId are required to publish.",
            };
        }

        if (result.PublishBlocked || result.CacheHit)
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = result.CacheHit ? ClosedLoopCacheHitPublishGuard.SkipReason : "Publish blocked by trust gate.",
            };
        }

        if (_findingsSnapshotRepository is null && _recommendationRepository is null)
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = "Product repositories are not registered in this host.",
            };
        }

        Guid runGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(runId);
        ScopeContext scope = BuildScope(tenantId, workspaceId, projectId);
        Guid? findingsSnapshotId = null;
        int recommendationCount = 0;

        if (_findingsSnapshotRepository is not null && result.ProductFindings.Count > 0)
        {
            await RecheckInventoryClaimsAsync(result, tenantId, workspaceId, projectId, runId, cancellationToken);
        }

        if (_findingsSnapshotRepository is not null && result.ProductFindings.Count > 0)
        {
            findingsSnapshotId = await MergeOrCreateFindingsSnapshotAsync(
                scope,
                runGuid,
                result.ProductFindings,
                cancellationToken).ConfigureAwait(false);
        }

        if (_recommendationRepository is not null)
        {
            foreach (var recommendation in result.ProductRecommendations)
            {
                await _recommendationRepository.UpsertAsync(recommendation, cancellationToken);
                recommendationCount++;
            }
        }

        return new ArchitectureIntelligencePublishResult
        {
            Published = findingsSnapshotId.HasValue || recommendationCount > 0,
            FindingsSnapshotId = findingsSnapshotId,
            RecommendationCount = recommendationCount,
            SkipReason = findingsSnapshotId is null && recommendationCount == 0
                ? "No publishable findings or recommendations."
                : null,
        };
    }

    private async Task RecheckInventoryClaimsAsync(
        ClosedLoopReasoningResult result, string tenantId, string workspaceId, string projectId, string runId,
        CancellationToken cancellationToken)
    {
        List<Finding> publishable = new(result.ProductFindings.Count);
        foreach (Finding finding in result.ProductFindings)
        {
            finding.Properties?.Remove(InventoryVerificationProperty);
            finding.Properties?.Remove(StorageTlsVerificationProperty);
            if (finding.Properties?.ContainsKey(ScopedPublicNetworkAccessVerifier.StorageTlsResourceProperty) == true ||
                InventoryStorageMinimumTlsVerifier.MentionsMinimumTls(finding.Title) ||
                InventoryStorageMinimumTlsVerifier.MentionsMinimumTls(finding.Rationale))
            {
                if (finding.Properties is { } properties &&
                    !properties.ContainsKey(ScopedPublicNetworkAccessVerifier.ResourceProperty) &&
                    properties.TryGetValue(ScopedPublicNetworkAccessVerifier.StorageTlsResourceProperty, out string? tlsResource) &&
                    Guid.TryParse(tlsResource, out Guid tlsId) &&
                    properties.TryGetValue(ScopedPublicNetworkAccessVerifier.StorageTlsSnapshotProperty, out string? tlsSnapshot) &&
                    Guid.TryParse(tlsSnapshot, out Guid expectedTlsSnapshot) &&
                    _publicNetworkAccessVerifier is not null &&
                    finding.Title == ScopedPublicNetworkAccessVerifier.StorageTlsTitle(tlsId) &&
                    finding.Rationale == ScopedPublicNetworkAccessVerifier.StorageTlsRationale)
                {
                    StorageMinimumTlsVerification current = await _publicNetworkAccessVerifier.VerifyStorageTlsAsync(
                        tenantId, workspaceId, projectId, runId, tlsId, cancellationToken);
                    if (current is { Outcome: StorageMinimumTlsOutcome.Verified, CapturedUtc: not null, ResourceRowId: not null }
                        && current.SnapshotId == expectedTlsSnapshot)
                    {
                        properties[StorageTlsVerificationProperty] = JsonSerializer.Serialize(current);
                        publishable.Add(finding);
                    }
                }

                continue;
            }
            if (finding.Properties is null || !finding.Properties.TryGetValue(ScopedPublicNetworkAccessVerifier.ResourceProperty, out string? resource))
            {
                publishable.Add(finding);
                continue;
            }

            if (Guid.TryParse(resource, out Guid resourceId) &&
                _publicNetworkAccessVerifier is not null &&
                finding.Title == ScopedPublicNetworkAccessVerifier.Title(resourceId) &&
                finding.Rationale == ScopedPublicNetworkAccessVerifier.Rationale)
            {
                PublicNetworkAccessVerification current = await _publicNetworkAccessVerifier.VerifyAsync(
                    tenantId, workspaceId, projectId, runId, resourceId, cancellationToken);
                if (current is { Outcome: PublicNetworkAccessVerificationOutcome.Verified, CapturedUtc: DateTime capturedUtc,
                    Evidence: not null } &&
                    finding.Properties.TryGetValue(ScopedPublicNetworkAccessVerifier.SnapshotProperty, out string? snapshot) &&
                    Guid.TryParse(snapshot, out Guid expectedSnapshot) && current.SnapshotId == expectedSnapshot)
                {
                    finding.Properties["architectureIntelligence.publicNetworkAccessCapturedUtc"] = capturedUtc.ToString("O");
                    finding.Properties[InventoryVerificationProperty] = JsonSerializer.Serialize(current);
                    publishable.Add(finding);
                }
            }
        }

        result.ProductFindings = publishable;
    }

    private async Task<Guid?> MergeOrCreateFindingsSnapshotAsync(
        ScopeContext scope,
        Guid runGuid,
        IReadOnlyList<Finding> productFindings,
        CancellationToken cancellationToken)
    {
        FindingsSnapshot? snapshot = null;

        if (_runRepository is not null)
        {
            ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
                .GetByIdAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            if (run?.FindingsSnapshotId is Guid existingSnapshotId)
            {
                snapshot = await _findingsSnapshotRepository!
                    .GetByIdAsync(scope, existingSnapshotId, cancellationToken)
                    .ConfigureAwait(false);
            }

            if (snapshot is null)
            {
                snapshot = new FindingsSnapshot
                {
                    FindingsSnapshotId = Guid.NewGuid(),
                    RunId = runGuid,
                    CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                    Findings = [],
                };
            }

            FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                snapshot,
                productFindings,
                TimeProvider.System);

            await _findingsSnapshotRepository!.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

            if (run is not null && run.FindingsSnapshotId != snapshot.FindingsSnapshotId)
            {
                run.FindingsSnapshotId = snapshot.FindingsSnapshotId;
                await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
            }

            return snapshot.FindingsSnapshotId;
        }

        snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runGuid,
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Findings = [],
        };

        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
            snapshot,
            productFindings,
            TimeProvider.System);

        await _findingsSnapshotRepository!.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        return snapshot.FindingsSnapshotId;
    }

    private static ScopeContext BuildScope(string tenantId, string workspaceId, string projectId)
    {
        return new ScopeContext
        {
            TenantId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId),
            WorkspaceId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(workspaceId),
            ProjectId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(projectId),
        };
    }
}
