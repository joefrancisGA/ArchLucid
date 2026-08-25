using ArchLucid.Application.Traceability;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Traceability;

/// <summary>Builds traceability bundle ZIP exports for run review-trail downloads.</summary>
public interface ITraceabilityBundleExportApplicationService
{
    Task<TraceabilityBundleExportResult> TryBuildZipAsync(
        string runId,
        string correlationId,
        CancellationToken ct);
}

/// <summary>Outcome of traceability bundle ZIP export.</summary>
public enum TraceabilityBundleExportOutcome
{
    Success,
    RunNotFound,
    TooLarge,
}

/// <summary>Result of <see cref="ITraceabilityBundleExportApplicationService.TryBuildZipAsync"/>.</summary>
public sealed record TraceabilityBundleExportResult(
    TraceabilityBundleExportOutcome Outcome,
    byte[]? ZipBytes,
    string? ErrorMessage,
    long? AttemptedBytes = null,
    long? MaxBytes = null);

/// <summary>
///     Default traceability bundle export orchestration shared by canonical and legacy run read controllers.
/// </summary>
public sealed class TraceabilityBundleExportApplicationService(
    ITraceabilityBundleBuilder traceabilityBundleBuilder,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ITraceabilityBundleExportApplicationService
{
    private const long MaxZipBytes = 1_500_000L;

    private readonly ITraceabilityBundleBuilder _traceabilityBundleBuilder =
        traceabilityBundleBuilder ?? throw new ArgumentNullException(nameof(traceabilityBundleBuilder));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<TraceabilityBundleExportResult> TryBuildZipAsync(
        string runId,
        string correlationId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            byte[]? zip = await _traceabilityBundleBuilder.BuildAsync(runId, scope, MaxZipBytes, ct);

            if (zip is null)
                return new TraceabilityBundleExportResult(TraceabilityBundleExportOutcome.RunNotFound, null, null);

            Guid? auditRunId = Guid.TryParse(runId, out Guid runGuidForAudit) ? runGuidForAudit : null;

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ExportDownloadSucceeded,
                    RunId = auditRunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorrelationId = correlationId,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(
                        new { exportType = "traceability-bundle.zip", fileName = $"traceability-{runId}.zip" },
                        AuditJsonSerializationOptions.Instance),
                },
                ct);

            return new TraceabilityBundleExportResult(TraceabilityBundleExportOutcome.Success, zip, null);
        }
        catch (TraceabilityBundleTooLargeException ex)
        {
            return new TraceabilityBundleExportResult(
                TraceabilityBundleExportOutcome.TooLarge,
                null,
                ex.Message,
                ex.AttemptedBytes,
                ex.MaxBytes);
        }
    }
}
