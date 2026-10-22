using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IReRunExecuteSealedManifestPinGate" />
public sealed class ReRunExecuteSealedManifestPinGate(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IAgentResultRepository resultRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IReRunExecuteSealedManifestPinGate
{
    public async Task EnsureReadyAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await ReRunExecuteSealedManifestPinGuard.EnsureReExecuteSourceReadyOrThrowAsync(
            runId,
            scope,
            runRepository,
            resultRepository,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
