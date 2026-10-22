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

    public static IDisposable PushJobScope(ScopeContext jobScope) => AmbientScopeContext.Push(jobScope);

    public static async Task<RunRecord> LoadPersistedRunAsync(
        IServiceScope scope,
        ScopeContext jobScope,
        AuthorityPipelineWorkOutboxEntry entry,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(jobScope);
        ArgumentNullException.ThrowIfNull(entry);

        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? persistedRun = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (persistedRun is null)
        {
            throw new InvalidOperationException(
                $"dbo.Runs row missing for deferred authority pipeline run '{entry.RunId:N}'.");
        }

        return persistedRun;
    }
}
