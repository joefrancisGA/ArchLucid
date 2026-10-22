using System.Text.Json;

using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotsApplicationService
{
    /// <inheritdoc />
    public async Task<PilotCloseoutCreateResult> CreateCloseoutAsync(
        string? runId,
        decimal? baselineHours,
        int speedScore,
        int manifestPackageScore,
        int traceabilityScore,
        string? notes,
        CancellationToken ct)
    {
        if (baselineHours is < 0)
            throw new ArgumentException("BaselineHours cannot be negative.");

        if (speedScore is < 1 or > 5 || manifestPackageScore is < 1 or > 5 || traceabilityScore is < 1 or > 5)
            throw new ArgumentException("Scores must be between 1 and 5.");

        Guid? runGuid = null;

        if (!string.IsNullOrWhiteSpace(runId))
        {
            if (!Guid.TryParse(runId, out Guid parsed))
                throw new ArgumentException("RunId must be a GUID string when supplied.");

            runGuid = parsed;
        }

        string? normalizedNotes = notes;

        if (normalizedNotes is not null && normalizedNotes.Length > 2000)
            normalizedNotes = normalizedNotes[..2000];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        Guid closeoutId = Guid.NewGuid();
        DateTimeOffset created = TimeProvider.System.GetUtcNow();

        PilotCloseoutRecord record = new()
        {
            CloseoutId = closeoutId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            BaselineHours = baselineHours,
            SpeedScore = (byte)speedScore,
            ManifestPackageScore = (byte)manifestPackageScore,
            TraceabilityScore = (byte)traceabilityScore,
            Notes = normalizedNotes,
            CreatedUtc = created,
        };

        await _pilotCloseoutRepository.InsertAsync(record, ct);

        string auditPayload = JsonSerializer.Serialize(
            new
            {
                closeoutId,
                runId = runGuid,
                baselineHours,
                speed = speedScore,
                manifestPackage = manifestPackageScore,
                traceability = traceabilityScore,
                notesLength = normalizedNotes?.Length ?? 0,
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PilotCloseoutRecorded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = auditPayload,
                CorrelationId = closeoutId.ToString(),
            },
            ct);

        return new PilotCloseoutCreateResult(closeoutId);
    }
}
