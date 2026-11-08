using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
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
        IServiceProvider services = scope.ServiceProvider;

        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        RunRecord? header = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (header is null || header.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
            return;

        if (string.IsNullOrWhiteSpace(header.ArchitectureRequestId))
            return;

        IArchitectureRequestRepository requestRepository =
            services.GetRequiredService<IArchitectureRequestRepository>();
        ArchitectureRequest? request = await requestRepository
            .GetByIdAsync(header.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request is null)
            return;

        IArchitectureKnowledgeModelAccess knowledgeModelAccess =
            services.GetRequiredService<IArchitectureKnowledgeModelAccess>();
        ArchitectureKnowledgeModel? knowledgeModel = await knowledgeModelAccess
            .GetForRunAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (HasIncompleteCreateTimePinFingerprints(header))
        {
            IRunCreatePinOrchestrator? createPinOrchestrator = services.GetService<IRunCreatePinOrchestrator>();

            if (createPinOrchestrator is not null)
            {
                await createPinOrchestrator
                    .ApplyCreateTimePinsAsync(header, DefaultScope, request, cancellationToken)
                    .ConfigureAwait(false);
            }

            if (knowledgeModel is not null)
            {
                RunHeaderKnowledgeModelContentPin.ApplyToHeader(
                    header,
                    knowledgeModel,
                    knowledgeModel.ModelId ?? header.KnowledgeModelId);
            }

            await runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);
        }

        IArchitectureVersionKnowledgeModelPinSync? pinSync =
            services.GetService<IArchitectureVersionKnowledgeModelPinSync>();

        if (pinSync is not null && knowledgeModel is not null)
        {
            await pinSync
                .SyncPinnedVersionToSavedModelAsync(DefaultScope, header, knowledgeModel, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        IArchitectureVersionService? versionService = services.GetService<IArchitectureVersionService>();

        if (versionService is not null)
        {
            await versionService
                .EnsureRunVersionPinnedAsync(
                    DefaultScope,
                    runGuid,
                    architectureId,
                    request,
                    knowledgeModel,
                    cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static bool HasIncompleteCreateTimePinFingerprints(RunRecord header)
    {
        return header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 }
               || header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 }
               || header.PinnedArchitectureVersionContentHashSha256 is null or { Length: 0 }
               || header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 };
    }
}
