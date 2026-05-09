using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Common;

/// <summary>
///     Durable echo for <see cref="AuditEventTypes.Baseline.Architecture" /> baseline events: one
///     <c>dbo.AuditEvents</c> row per signal using <see cref="AuditEventTypes.Run" /> wire values.
/// </summary>
internal static class BaselineMutationAuditArchitectureDurableWriter
{
    public static async Task TryWriteArchitectureDurableEchoAsync(
        string eventType,
        string actor,
        string entityId,
        string details,
        IAuditService auditService,
        IScopeContextProvider scopeContextProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (auditService is null)
            throw new ArgumentNullException(nameof(auditService));

        if (scopeContextProvider is null)
            throw new ArgumentNullException(nameof(scopeContextProvider));

        if (logger is null)
            throw new ArgumentNullException(nameof(logger));

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunFailed, StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid g) ? g : null;

                    AuditEvent failed = scope.CreateAuditEvent(
                        AuditEventTypes.Run.Failed,
                        actor,
                        actor,
                        JsonSerializer.Serialize(new { runId = entityId, reason = details }));
                    failed.RunId = runGuid;

                    await auditService.LogAsync(failed, ct);
                },
                logger,
                $"Run.Failed:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);

            return;
        }

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunCreated, StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid rid) ? rid : null;
                    Dictionary<string, string> kv = ParseSemicolonKeyValues(details);

                    string requestId = GetDetail(kv, "RequestId");
                    string systemName = GetDetail(kv, "SystemName");

                    AuditEvent created = scope.CreateAuditEvent(
                        AuditEventTypes.Run.Created,
                        actor,
                        actor,
                        JsonSerializer.Serialize(new { requestId, systemName }));
                    created.RunId = runGuid;

                    await auditService.LogAsync(created, ct);
                },
                logger,
                $"Run.Created:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);

            return;
        }

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunStarted, StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid rid) ? rid : null;

                    AuditEvent executeStarted = scope.CreateAuditEvent(
                        AuditEventTypes.Run.ExecuteStarted,
                        actor,
                        actor,
                        JsonSerializer.Serialize(new { runId = entityId }));
                    executeStarted.RunId = runGuid;

                    await auditService.LogAsync(executeStarted, ct);
                },
                logger,
                $"Run.ExecuteStarted:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);

            return;
        }

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded,
                StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid rid) ? rid : null;
                    int resultCount = TryParseResultCount(details);

                    AuditEvent executeSucceeded = scope.CreateAuditEvent(
                        AuditEventTypes.Run.ExecuteSucceeded,
                        actor,
                        actor,
                        JsonSerializer.Serialize(new { runId = entityId, resultCount }));
                    executeSucceeded.RunId = runGuid;

                    await auditService.LogAsync(executeSucceeded, ct);
                },
                logger,
                $"Run.ExecuteSucceeded:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);

            return;
        }

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunQualityGateRejected, StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid parsedRun) ? parsedRun : null;
                    Dictionary<string, string> kv = ParseSemicolonKeyValues(details);

                    AuditEvent rejected = scope.CreateAuditEvent(
                        AuditEventTypes.Run.QualityGateRejected,
                        actor,
                        actor,
                        JsonSerializer.Serialize(
                            new { runId = entityId, traceId = GetDetail(kv, "TraceId"), agentLabel = GetDetail(kv, "AgentLabel"), }));
                    rejected.RunId = runGuid;

                    await auditService.LogAsync(rejected, ct);
                },
                logger,
                $"Run.QualityGateRejected:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);

            return;
        }

        if (string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunCompleted, StringComparison.Ordinal))
        {
            await DurableAuditLogRetry.TryLogAsync(
                async ct =>
                {
                    ScopeContext scope = scopeContextProvider.GetCurrentScope();
                    Guid? runGuid = Guid.TryParse(entityId, out Guid rid) ? rid : null;
                    Dictionary<string, string> kv = ParseSemicolonKeyValues(details);
                    string manifestVersion = GetDetail(kv, "ManifestVersion");
                    string systemName = GetDetail(kv, "SystemName");
                    int warningCount = int.TryParse(GetDetail(kv, "WarningCount"), out int wc) ? wc : 0;
                    string? commitPath = GetDetailOrNull(kv, "CommitPath");

                    string commitJson = string.IsNullOrWhiteSpace(commitPath)
                        ? JsonSerializer.Serialize(new { runId = entityId, manifestVersion, systemName })
                        : JsonSerializer.Serialize(
                            new
                            {
                                runId = entityId,
                                manifestVersion,
                                systemName,
                                warningCount,
                                commitPath
                            });

                    AuditEvent commitCompleted = scope.CreateAuditEvent(
                        AuditEventTypes.Run.CommitCompleted,
                        actor,
                        actor,
                        commitJson);
                    commitCompleted.RunId = runGuid;

                    await auditService.LogAsync(commitCompleted, ct);
                },
                logger,
                $"Run.CommitCompleted:{LogSanitizer.Sanitize(entityId)}",
                cancellationToken);
        }
    }

    private static string GetDetail(Dictionary<string, string> map, string key)
    {
        return map.TryGetValue(key, out string? v) ? v : string.Empty;
    }

    private static string? GetDetailOrNull(Dictionary<string, string> map, string key)
    {
        return map.TryGetValue(key, out string? v) ? v : null;
    }

    private static Dictionary<string, string> ParseSemicolonKeyValues(string details)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(details))
            return map;

        foreach (string segment in details.Split(';',
                     StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        {
            int eq = segment.IndexOf('=');

            if (eq <= 0 || eq >= segment.Length - 1)
                continue;

            string key = segment[..eq].Trim();
            string value = segment[(eq + 1)..].Trim();

            if (key.Length > 0)
                map[key] = value;
        }

        return map;
    }


    private static int TryParseResultCount(string details)
    {
        if (string.IsNullOrWhiteSpace(details))
            return 0;

        Match m = Regex.Match(details, @"ResultCount\s*=\s*(\d+)", RegexOptions.IgnoreCase);

        return m.Success && int.TryParse(m.Groups[1].Value, out int n) ? n : 0;
    }
}
