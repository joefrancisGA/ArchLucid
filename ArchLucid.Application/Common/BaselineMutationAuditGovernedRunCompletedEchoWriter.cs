using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Common;

/// <summary>
///     Fail-closed durable echo for finalize (<c>Architecture.RunCompleted</c> → <c>Run.CommitCompleted</c>) per ADR 0075.
/// </summary>
internal static class BaselineMutationAuditGovernedRunCompletedEchoWriter
{
    public static Task WriteAsync(
        string actor,
        string entityId,
        string details,
        IAuditService auditService,
        IScopeContextProvider scopeContextProvider,
        ILogger logger,
        CancellationToken cancellationToken) =>
        DurableAuditLogRetry.LogOrThrowAsync(
            async ct =>
            {
                ScopeContext scope = scopeContextProvider.GetCurrentScope();
                Guid? runGuid = Guid.TryParse(entityId, out Guid rid) ? rid : null;
                Dictionary<string, string> kv = BaselineMutationAuditArchitectureDurableWriter.ParseSemicolonKeyValues(details);
                string manifestVersion = BaselineMutationAuditArchitectureDurableWriter.GetDetail(kv, "ManifestVersion");
                string systemName = BaselineMutationAuditArchitectureDurableWriter.GetDetail(kv, "SystemName");
                int warningCount = int.TryParse(
                    BaselineMutationAuditArchitectureDurableWriter.GetDetail(kv, "WarningCount"),
                    out int wc)
                    ? wc
                    : 0;
                string? commitPath = BaselineMutationAuditArchitectureDurableWriter.GetDetailOrNull(kv, "CommitPath");

                string commitJson = string.IsNullOrWhiteSpace(commitPath)
                    ? JsonSerializer.Serialize(new { runId = entityId, manifestVersion, systemName })
                    : JsonSerializer.Serialize(
                        new
                        {
                            runId = entityId,
                            manifestVersion,
                            systemName,
                            warningCount,
                            commitPath,
                        });

                AuditEvent commitCompleted = scope.CreateAuditEvent(
                    AuditEventTypes.Run.CommitCompleted,
                    actor,
                    actor,
                    commitJson);
                commitCompleted.RunId = runGuid;

                await auditService.LogAsync(commitCompleted, ct);

                if (runGuid is Guid committedRunGuid)
                {
                    AuditEvent lifecycleTransition = AuthorityRunLifecycleTransitionAuditor.BuildTransitionEvent(
                        scope,
                        committedRunGuid,
                        AuthorityRunLifecyclePhase.InProgress,
                        AuthorityRunLifecyclePhase.Complete,
                        "commit-completed",
                        actor);
                    await auditService.LogAsync(lifecycleTransition, ct);
                }
            },
            logger,
            $"Run.CommitCompleted:{LogSanitizer.Sanitize(entityId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.Run.CommitCompleted);
}
