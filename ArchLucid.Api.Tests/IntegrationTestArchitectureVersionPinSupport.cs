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

        IArchitectureKnowledgeModelAccess knowledgeModelAccess =
            services.GetRequiredService<IArchitectureKnowledgeModelAccess>();
        ArchitectureKnowledgeModel? knowledgeModel = await knowledgeModelAccess
            .GetForRunAsync(DefaultScope, runGuid, cancellationToken);

        if (IsPolicyOrEvidencePinMissing(header))
        {
            IRunCreatePinOrchestrator createPinOrchestrator =
                services.GetRequiredService<IRunCreatePinOrchestrator>();

            await createPinOrchestrator
                .ApplyCreateTimePinsAsync(header, DefaultScope, request, cancellationToken);
            await runRepository.UpdateAsync(header, cancellationToken);
            header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        }

        if (HasIncompleteCreateTimePinFingerprints(header) && knowledgeModel is not null)
        {
            RunHeaderKnowledgeModelContentPin.ApplyToHeader(
                header,
                knowledgeModel,
                knowledgeModel.ModelId ?? header.KnowledgeModelId);
            await runRepository.UpdateAsync(header, cancellationToken);
            header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        }

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

        knowledgeModel ??= await knowledgeModelAccess.GetForRunAsync(DefaultScope, runGuid, cancellationToken);

        if (header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 } && knowledgeModel is not null)
        {
            RunHeaderKnowledgeModelContentPin.ApplyToHeader(
                header,
                knowledgeModel,
                knowledgeModel.ModelId ?? header.KnowledgeModelId);
            await runRepository.UpdateAsync(header, cancellationToken);
            header = await runRepository.GetByIdAsync(DefaultScope, runGuid, cancellationToken) ?? header;
        }

        if (header is not null && HasIncompleteCreateTimePinFingerprints(header))
        {
            throw new InvalidOperationException(
                $"Run '{runId}' still has incomplete create-time pin fingerprints after backfill: {DescribeMissingPins(header)}.");
        }
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
