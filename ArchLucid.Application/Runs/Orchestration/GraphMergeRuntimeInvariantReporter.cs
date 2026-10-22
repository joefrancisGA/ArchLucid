using System.Text.Json;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

public interface IGraphMergeRuntimeInvariantReporter
{
    Task ReportAfterMergeAsync(
        ScopeContext scope,
        GraphSnapshot mergedGraph,
        CancellationToken cancellationToken = default);
}

/// <summary>Logs and audits post-merge graph invariant violations without failing the run.</summary>
public sealed class GraphMergeRuntimeInvariantReporter(
    IAuditService auditService,
    IHostEnvironment hostEnvironment,
    IOptions<GraphMergeRuntimeInvariantOptions> options,
    ILogger<GraphMergeRuntimeInvariantReporter> logger) : IGraphMergeRuntimeInvariantReporter
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IHostEnvironment _hostEnvironment = hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly GraphMergeRuntimeInvariantOptions _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<GraphMergeRuntimeInvariantReporter> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task ReportAfterMergeAsync(
        ScopeContext scope,
        GraphSnapshot mergedGraph,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mergedGraph);

        if (!_options.Enabled)
            return;

        IReadOnlyList<GraphMergeInvariantViolation> violations = GraphMergeInvariantChecker.Check(mergedGraph);

        if (violations.Count == 0)
            return;

        bool auditOnly = _options.AuditOnlyInProduction && _hostEnvironment.IsProduction();

        foreach (GraphMergeInvariantViolation violation in violations)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Graph merge invariant violation ({Kind}) for run {RunId} snapshot {SnapshotId}: {Message}. AuditOnly={AuditOnly}.",
                    violation.Kind,
                    mergedGraph.RunId,
                    mergedGraph.GraphSnapshotId,
                    violation.Message,
                    auditOnly);
            }
        }

        await DurableAuditLogRetry.TryLogAsync(
            cancellationToken => _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.GraphMergeInvariantViolation,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            runId = mergedGraph.RunId,
                            graphSnapshotId = mergedGraph.GraphSnapshotId,
                            violationCount = violations.Count,
                            violations = violations.Select(static v => new { kind = v.Kind.ToString(), message = v.Message }),
                            auditOnly,
                        })
                },
                cancellationToken),
            _logger,
            nameof(GraphMergeRuntimeInvariantReporter),
            cancellationToken);
    }
}
