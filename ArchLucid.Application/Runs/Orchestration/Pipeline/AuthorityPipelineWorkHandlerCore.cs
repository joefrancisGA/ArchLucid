using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Shared scope push and run-load helpers for authority pipeline outbox handlers.
/// </summary>
public static class AuthorityPipelineWorkHandlerCore
{
    public static ScopeContext CreateJobScope(AuthorityPipelineWorkOutboxEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new ScopeContext
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
        };
    }

    public static IDisposable PushJobScope(ScopeContext jobScope)
    {
        if (!CommittedRunEvidenceBinding.HasExplicitScope(jobScope) ||
            !CommittedRunEvidenceBinding.MatchesDrainScope(jobScope, AmbientScopeContext.CurrentOverride))
        {
            throw new InvalidOperationException("Deferred authority pipeline work cannot change the active drain scope.");
        }

        return AmbientScopeContext.Push(jobScope);
    }

    public static async Task<RunRecord?> FindBoundActiveRunAsync(
        IRunRepository runs, ScopeContext jobScope, Guid runId, CancellationToken cancellationToken)
    {
        if (!CommittedRunEvidenceBinding.HasExplicitScope(jobScope) || runId == Guid.Empty ||
            !CommittedRunEvidenceBinding.MatchesDrainScope(jobScope, AmbientScopeContext.CurrentOverride))
        {
            return null;
        }

        // This repository path bypasses the hot-path run cache. Archived runs cannot authorize work.
        RunRecord? run = await runs.GetByIdIncludingArchivedAsync(jobScope, runId, cancellationToken)
            .ConfigureAwait(false);
        return CommittedRunEvidenceBinding.MatchesActiveRun(jobScope, runId, run) ? run : null;
    }

    public static async Task<RunRecord> LoadPersistedRunAsync(
        IServiceScope scope,
        ScopeContext jobScope,
        AuthorityPipelineWorkOutboxEntry entry,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(jobScope);
        ArgumentNullException.ThrowIfNull(entry);

        if (entry.TenantId != jobScope.TenantId || entry.WorkspaceId != jobScope.WorkspaceId ||
            entry.ProjectId != jobScope.ProjectId)
        {
            throw new InvalidOperationException("Deferred authority pipeline work does not match the requested scope.");
        }

        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? persistedRun = await FindBoundActiveRunAsync(runRepository, jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (persistedRun is null)
        {
            throw new InvalidOperationException(
                $"No matching active run for deferred authority pipeline run '{entry.RunId:N}'.");
        }

        return persistedRun;
    }
}
