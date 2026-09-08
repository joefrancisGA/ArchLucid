using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Authority;

/// <summary>
///     Appends <see cref="AuditEventTypes.AuthorityCommittedChainPersisted"/> after the authority snapshot chain
///     and golden manifest rows are committed (caller must invoke only after successful SQL persistence / UoW commit).
/// </summary>
public static class AuthorityCommittedChainDurableAudit
{
    /// <summary>
    ///     Fail-closed Required audit for Working career finalize/commit (ADR 0075 / LP-10).
    /// </summary>
    public static Task LogRequiredAsync(
        IAuditService auditService,
        IScopeContextProvider scopeProvider,
        string actor,
        ILogger logger,
        Guid authorityRunId,
        string projectSlug,
        AuthorityManifestPersistResult chainResult,
        string source,
        bool richFindingsAndGraph,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(projectSlug);
        ArgumentNullException.ThrowIfNull(chainResult);
        ArgumentException.ThrowIfNullOrWhiteSpace(source);

        AuditEvent auditEvent = BuildAuditEvent(
            scopeProvider,
            actor,
            authorityRunId,
            projectSlug,
            chainResult,
            source,
            richFindingsAndGraph);

        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => auditService.LogAsync(auditEvent, ct),
            logger,
            $"AuthorityCommittedChainPersisted:{LogSanitizer.Sanitize(source)}:{authorityRunId:N}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.AuthorityCommittedChainPersisted);
    }

    /// <summary>
    ///     Best-effort informational audit for demo seed / Guided sample paths (TB-001).
    /// </summary>
    [InformationalAudit]
    public static async Task TryLogAsync(
        IAuditService auditService,
        IScopeContextProvider scopeProvider,
        IActorContext actorContext,
        ILogger logger,
        Guid authorityRunId,
        string projectSlug,
        AuthorityManifestPersistResult chainResult,
        string source,
        bool richFindingsAndGraph,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(actorContext);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(projectSlug);
        ArgumentNullException.ThrowIfNull(chainResult);
        ArgumentNullException.ThrowIfNull(source);

        try
        {
            string actor = actorContext.GetActor();
            AuditEvent auditEvent = BuildAuditEvent(
                scopeProvider,
                actor,
                authorityRunId,
                projectSlug,
                chainResult,
                source,
                richFindingsAndGraph);

            await auditService.LogAsync(auditEvent, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Durable audit for AuthorityCommittedChainPersisted failed for RunId={RunId}",
                    LogSanitizer.Sanitize(authorityRunId.ToString("N")));
            }
        }
    }

    internal static AuthorityManifestPersistResult FromManifestDocument(ManifestDocument manifest) =>
        new(
            manifest.ContextSnapshotId,
            manifest.GraphSnapshotId,
            manifest.FindingsSnapshotId,
            manifest.DecisionTraceId,
            manifest.ManifestId);

    private static AuditEvent BuildAuditEvent(
        IScopeContextProvider scopeProvider,
        string actor,
        Guid authorityRunId,
        string projectSlug,
        AuthorityManifestPersistResult chainResult,
        string source,
        bool richFindingsAndGraph)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        string correlationId = Activity.Current?.Id ?? $"{LogSanitizer.Sanitize(source)}:{authorityRunId:N}";
        object payload = new
        {
            source = LogSanitizer.Sanitize(source),
            projectSlug = LogSanitizer.Sanitize(projectSlug),
            richFindingsAndGraph,
            contextSnapshotId = chainResult.ContextSnapshotId,
            graphSnapshotId = chainResult.GraphSnapshotId,
            findingsSnapshotId = chainResult.FindingsSnapshotId,
            decisionTraceId = chainResult.DecisionTraceId,
            manifestId = chainResult.GoldenManifestId
        };
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.AuthorityCommittedChainPersisted,
            actor,
            actor,
            JsonSerializer.Serialize(payload));
        auditEvent.RunId = authorityRunId;
        auditEvent.ManifestId = chainResult.GoldenManifestId;
        auditEvent.CorrelationId = correlationId;

        return auditEvent;
    }
}
