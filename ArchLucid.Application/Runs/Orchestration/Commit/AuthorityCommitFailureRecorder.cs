using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <inheritdoc cref="IAuthorityCommitFailureRecorder" />
public sealed class AuthorityCommitFailureRecorder(
    IBaselineMutationAuditService baselineMutationAudit,
    IAzureDevOpsCommitStatusPublisher azureDevOpsCommitStatusPublisher,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ILogger<AuthorityCommitFailureRecorder> logger) : IAuthorityCommitFailureRecorder
{
    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IAzureDevOpsCommitStatusPublisher _azureDevOpsCommitStatusPublisher =
        azureDevOpsCommitStatusPublisher ?? throw new ArgumentNullException(nameof(azureDevOpsCommitStatusPublisher));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<AuthorityCommitFailureRecorder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task RecordFailureAsync(
        string actor,
        string runId,
        string auditDetails,
        CancellationToken cancellationToken)
    {
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            auditDetails,
            cancellationToken);

        if (Guid.TryParseExact(runId, "N", out Guid runGuid) || Guid.TryParse(runId, out runGuid))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            AuditEvent lifecycleTransition = AuthorityRunLifecycleTransitionAuditor.BuildTransitionEvent(
                scope,
                runGuid,
                AuthorityRunLifecyclePhase.InProgress,
                AuthorityRunLifecyclePhase.Failed,
                auditDetails,
                actor);
            await _auditService.LogAsync(lifecycleTransition, cancellationToken);
        }

        await TryPublishAzureDevOpsCommitStatusBestEffortAsync(runId, succeeded: false, cancellationToken);
    }

    /// <inheritdoc />
    public async Task TryPublishAzureDevOpsCommitStatusBestEffortAsync(
        string runId,
        bool succeeded,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
            return;

        try
        {
            await _azureDevOpsCommitStatusPublisher
                .PublishCommitOutcomeAsync(runGuid, succeeded, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Azure DevOps commit status publish failed for RunId={RunId} (Succeeded={Succeeded}).",
                    LogSanitizer.Sanitize(runId),
                    succeeded);
            }
        }
    }
}
