using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;
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
            return;

        if (header.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
        {
            IArchitectureRunCreateIdentityLinkHook? identityLink =
                services.GetService<IArchitectureRunCreateIdentityLinkHook>();

            if (identityLink is not null)
            {
                await identityLink.TryLinkReviewRunArchitectureIdentityAsync(request, runId, cancellationToken);
                header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken);

                if (header is null)
                    return;
            }
        }

        architectureId = header.ArchitectureId ?? Guid.Empty;

        if (architectureId == Guid.Empty)
            return;

        IArchitectureKnowledgeModelAccess knowledgeModelAccess =
            services.GetRequiredService<IArchitectureKnowledgeModelAccess>();
        ArchitectureKnowledgeModel? knowledgeModel = await knowledgeModelAccess
            .GetForRunAsync(DefaultScope, runGuid, cancellationToken);

        bool headerMutated = false;

        if (HasIncompleteCreateTimePinFingerprints(header))
        {
            IRunCreatePinOrchestrator? createPinOrchestrator = services.GetService<IRunCreatePinOrchestrator>();

            if (createPinOrchestrator is not null)
            {
                await createPinOrchestrator
                    .ApplyCreateTimePinsAsync(header, DefaultScope, request, cancellationToken);
                headerMutated = true;
            }

            if (knowledgeModel is not null)
            {
                RunHeaderKnowledgeModelContentPin.ApplyToHeader(
                    header,
                    knowledgeModel,
                    knowledgeModel.ModelId ?? header.KnowledgeModelId);
                headerMutated = true;
            }

            if (headerMutated)
                await runRepository.UpdateAsync(header, cancellationToken);
        }

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;

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

        header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken);

        if (header is null)
            return;

        knowledgeModel ??= await knowledgeModelAccess.GetForRunAsync(DefaultScope, runGuid, cancellationToken);

        if (header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 } && knowledgeModel is not null)
        {
            RunHeaderKnowledgeModelContentPin.ApplyToHeader(
                header,
                knowledgeModel,
                knowledgeModel.ModelId ?? header.KnowledgeModelId);
            await runRepository.UpdateAsync(header, cancellationToken);
        }
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

    private static bool HasIncompleteCreateTimePinFingerprints(RunRecord header)
    {
        return header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 }
               || header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 }
               || header.PinnedArchitectureVersionContentHashSha256 is null or { Length: 0 }
               || header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 };
    }
}
