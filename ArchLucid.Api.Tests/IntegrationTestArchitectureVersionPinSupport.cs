using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL integration hosts may persist architecture knowledge after the run header's κ pin was written
///     (closed-loop admit, execute stages). Re-sync the pinned <c>ArchitectureVersionId</c> before finalize
///     so commit integrity checks match production pin-sync behavior.
/// </summary>
internal static class IntegrationTestArchitectureVersionPinSupport
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject,
    };

    internal static async Task EnsureCurrentPinForRunAsync(
        IntegrationTestWebAppFactoryBase factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
            return;

        using IServiceScope scope = factory.Services.CreateScope();
        using IDisposable ambientScope = AmbientScopeContext.Push(DefaultScope);
        await EnsureCreateTimePinFingerprintsForRunAsync(scope.ServiceProvider, runId, runGuid, cancellationToken);
    }

    private static async Task EnsureCreateTimePinFingerprintsForRunAsync(
        IServiceProvider services,
        string runId,
        Guid runGuid,
        CancellationToken cancellationToken)
    {
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        RunRecord? header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken);

        if (header is null)
            return;

        ArchitectureRequest? request = await TryLoadArchitectureRequestAsync(services, header, cancellationToken);

        if (request is null)
        {
            throw new InvalidOperationException(
                $"Run '{runId}' has no resolvable architecture request (ArchitectureRequestId='{header.ArchitectureRequestId}').");
        }

        await EnsureArchitectureIdentityLinkedForBackfillAsync(services, runId, runGuid, request, cancellationToken);

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            ?? throw new InvalidOperationException($"Run '{runId}' was not found after architecture identity link.");

        Guid architectureId = header.ArchitectureId ?? Guid.Empty;

        if (architectureId == Guid.Empty)
        {
            throw new InvalidOperationException($"Run '{runId}' is missing ArchitectureId after identity link backfill.");
        }

        ArchitectureKnowledgeModel? knowledgeModel =
            await TryLoadKnowledgeModelForPinBackfillAsync(services, runGuid, header, cancellationToken);

        if (IsPolicyOrEvidencePinMissing(header))
        {
            IRunCreatePinOrchestrator createPinOrchestrator =
                services.GetRequiredService<IRunCreatePinOrchestrator>();

            await createPinOrchestrator
                .ApplyCreateTimePinsAsync(header, DefaultScope, request, cancellationToken);
            await runRepository.UpdateAsync(header, cancellationToken);
            header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        }

        await EnsureKnowledgeModelContentPinOnHeaderAsync(
            services,
            runGuid,
            header,
            knowledgeModel,
            cancellationToken);

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        knowledgeModel ??= await TryLoadKnowledgeModelForPinBackfillAsync(services, runGuid, header, cancellationToken);

        IArchitectureVersionKnowledgeModelPinSync? pinSync =
            services.GetService<IArchitectureVersionKnowledgeModelPinSync>();

        if (pinSync is not null && knowledgeModel is not null)
        {
            await pinSync.SyncPinnedVersionToSavedModelAsync(DefaultScope, header, knowledgeModel, cancellationToken);
        }
        else
        {
            IArchitectureVersionService versionService = services.GetRequiredService<IArchitectureVersionService>();
            await versionService.EnsureRunVersionPinnedAsync(
                DefaultScope,
                runGuid,
                architectureId,
                request,
                knowledgeModel,
                cancellationToken);
        }

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        knowledgeModel ??= await TryLoadKnowledgeModelForPinBackfillAsync(services, runGuid, header, cancellationToken);
        await EnsureKnowledgeModelContentPinOnHeaderAsync(
            services,
            runGuid,
            header,
            knowledgeModel,
            cancellationToken);

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken);

        if (header is not null && HasIncompleteCreateTimePinFingerprints(header))
        {
            throw new InvalidOperationException(
                $"Run '{runId}' still has incomplete create-time pin fingerprints after backfill: {DescribeMissingPins(header)}.");
        }
    }

    /// <summary>
    ///     <see cref="IArchitectureKnowledgeModelAccess.GetForRunAsync" /> fail-closes when the header lacks a κ hash;
    ///     backfill must load persisted models without that guard.
    /// </summary>
    private static async Task<ArchitectureKnowledgeModel?> TryLoadKnowledgeModelForPinBackfillAsync(
        IServiceProvider services,
        Guid runGuid,
        RunRecord header,
        CancellationToken cancellationToken)
    {
        IArchitectureIntelligencePersistence? persistence =
            services.GetService<IArchitectureIntelligencePersistence>();

        if (persistence is null)
            return null;

        string tenantId = DefaultScope.TenantId.ToString("D");

        if (!string.IsNullOrWhiteSpace(header.KnowledgeModelId))
        {
            ArchitectureKnowledgeModel? byModelId = await persistence
                .GetModelAsync(tenantId, header.KnowledgeModelId, cancellationToken);

            if (byModelId is not null)
                return byModelId;
        }

        ArchitectureKnowledgeModel? byRunId = await persistence
            .GetModelByRunIdAsync(tenantId, runGuid.ToString("D"), cancellationToken);

        if (byRunId is not null)
            return byRunId;

        byRunId = await persistence
            .GetModelByRunIdAsync(tenantId, runGuid.ToString("N"), cancellationToken);

        if (byRunId is not null)
            return byRunId;

        IArchitectureIdentityRepository? identityRepository =
            services.GetService<IArchitectureIdentityRepository>();

        if (identityRepository is null || header.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
            return null;

        ArchitectureIdentityRecord? identity = await identityRepository
            .GetByIdAsync(DefaultScope, architectureId, cancellationToken);

        if (identity is null || string.IsNullOrWhiteSpace(identity.CurrentModelId))
            return null;

        return await persistence.GetModelAsync(tenantId, identity.CurrentModelId, cancellationToken);
    }

    private static async Task EnsureKnowledgeModelContentPinOnHeaderAsync(
        IServiceProvider services,
        Guid runGuid,
        RunRecord header,
        ArchitectureKnowledgeModel? knowledgeModel,
        CancellationToken cancellationToken)
    {
        if (header.PinnedKnowledgeModelContentHashSha256 is { Length: > 0 })
            return;

        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();

        knowledgeModel ??= await TryLoadKnowledgeModelForPinBackfillAsync(services, runGuid, header, cancellationToken);

        // A missing persisted model is an evidence-integrity failure, not permission
        // for the test harness to manufacture an empty replacement model.
        if (knowledgeModel is null)
        {
            throw new InvalidOperationException(
                $"Run '{runGuid:N}' has no persisted knowledge model for pin backfill; refusing to synthesize evidence.");
        }

        RunHeaderKnowledgeModelContentPin.ApplyToHeader(
            header,
            knowledgeModel,
            knowledgeModel.ModelId ?? header.KnowledgeModelId);

        if (header.PinnedKnowledgeModelContentHashSha256 is not { Length: > 0 })
        {
            throw new InvalidOperationException(
                $"Run '{runGuid:N}' persisted knowledge model produced no content hash.");
        }

        await runRepository.UpdateAsync(header, cancellationToken);
    }

    private static async Task EnsureArchitectureIdentityLinkedForBackfillAsync(
        IServiceProvider services,
        string runId,
        Guid runGuid,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        RunRecord? header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (header.ArchitectureId is Guid architectureId && architectureId != Guid.Empty)
            return;

        IArchitectureRunCreateIdentityLinkHook? identityLink =
            services.GetService<IArchitectureRunCreateIdentityLinkHook>();

        if (identityLink is not null)
        {
            await identityLink.TryLinkReviewRunArchitectureIdentityAsync(request, runId, cancellationToken);

            return;
        }

        IArchitectureIdentityService identityService = services.GetRequiredService<IArchitectureIdentityService>();
        await identityService.TryEnsureReviewRunLinkedAsync(
            DefaultScope,
            runGuid,
            request,
            header.KnowledgeModelId,
            cancellationToken);
    }

    private static async Task<ArchitectureRequest?> TryLoadArchitectureRequestAsync(
        IServiceProvider services,
        RunRecord header,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(header.ArchitectureRequestId))
            return null;

        IArchitectureRequestRepository requestRepository =
            services.GetRequiredService<IArchitectureRequestRepository>();

        return await requestRepository.GetByIdAsync(header.ArchitectureRequestId, cancellationToken);
    }

    private static bool IsPolicyOrEvidencePinMissing(RunRecord header)
    {
        return header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 }
               || header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 };
    }

    private static bool HasIncompleteCreateTimePinFingerprints(RunRecord header)
    {
        return header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 }
               || header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 }
               || header.PinnedArchitectureVersionContentHashSha256 is null or { Length: 0 }
               || header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 };
    }

    private static string DescribeMissingPins(RunRecord header)
    {
        List<string> missing = [];

        if (header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 })
            missing.Add(nameof(RunRecord.PinnedPolicyPackIdsHashSha256));

        if (header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 })
            missing.Add(nameof(RunRecord.PinnedEvidencePackagePinsHashSha256));

        if (header.PinnedArchitectureVersionContentHashSha256 is null or { Length: 0 })
            missing.Add(nameof(RunRecord.PinnedArchitectureVersionContentHashSha256));

        if (header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 })
            missing.Add(nameof(RunRecord.PinnedKnowledgeModelContentHashSha256));

        return string.Join(", ", missing);
    }
}
