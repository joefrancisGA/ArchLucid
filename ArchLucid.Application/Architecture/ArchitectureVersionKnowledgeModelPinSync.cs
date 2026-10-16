using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IArchitectureVersionKnowledgeModelPinSync" />
public sealed class ArchitectureVersionKnowledgeModelPinSync(
    IArchitectureVersionService architectureVersionService,
    IArchitectureRequestRepository architectureRequestRepository) : IArchitectureVersionKnowledgeModelPinSync
{
    private readonly IArchitectureVersionService _architectureVersionService =
        architectureVersionService ?? throw new ArgumentNullException(nameof(architectureVersionService));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    /// <inheritdoc />
    public async Task SyncPinnedVersionToSavedModelAsync(
        ScopeContext scope,
        RunRecord run,
        ArchitectureKnowledgeModel knowledgeModel,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(knowledgeModel);

        if (run.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
            return;

        ArchitectureRequest request = await LoadPinnedArchitectureRequestOrThrowAsync(run, cancellationToken)
            .ConfigureAwait(false);

        await _architectureVersionService
            .EnsureRunVersionPinnedAsync(
                scope,
                run.RunId,
                architectureId,
                request,
                knowledgeModel,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<ArchitectureRequest> LoadPinnedArchitectureRequestOrThrowAsync(
        RunRecord run,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
        {
            throw new ConflictException(
                "Architecture version pin sync blocked: run is missing ArchitectureRequestId after knowledge model save.");
        }

        ArchitectureRequest? request = await _architectureRequestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request is null)
        {
            throw new ConflictException(
                "Architecture version pin sync blocked: architecture request was not found after knowledge model save.");
        }

        return request;
    }
}
