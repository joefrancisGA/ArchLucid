using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecureNowPilotPathDispositionService(
    ISecurityEvidencePathRepository pathRepository,
    IAuditService auditService,
    IAuditRepository auditRepository) : ISecureNowPilotPathDispositionService
{
    private static readonly HashSet<string> AllowedOutcomes = new(StringComparer.Ordinal)
    {
        "Proceed",
        "Extend",
        "Stop",
    };

    public async Task<SecureNowPilotPathDispositionResponse?> TryGetLatestAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (pathId == Guid.Empty)
        {
            return null;
        }

        SecurityEvidencePathRecord? path =
            await pathRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        if (path is null)
        {
            return null;
        }

        IReadOnlyList<AuditEvent> events = await auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            new AuditEventFilter
            {
                EventType = AuditEventTypes.SecureNowPilotPathDispositionRecorded,
                IncludeDataJson = true,
                Take = 500,
            },
            cancellationToken);

        foreach (AuditEvent auditEvent in events.OrderByDescending(item => item.OccurredUtc))
        {
            SecureNowPilotPathDispositionResponse? parsed = TryParseDisposition(pathId, auditEvent);

            if (parsed is not null)
            {
                return parsed;
            }
        }

        return null;
    }

    public async Task<SecureNowPilotPathDispositionSaveResult> SaveAsync(
        ScopeContext scope,
        Guid pathId,
        SecureNowPilotPathDispositionWriteRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (pathId == Guid.Empty)
        {
            return Failed("PathId is required.");
        }

        string outcome = request.Outcome?.Trim() ?? string.Empty;
        string rationale = request.Rationale?.Trim() ?? string.Empty;

        if (!AllowedOutcomes.Contains(outcome))
        {
            return Failed("Outcome must be Proceed, Extend, or Stop.");
        }

        if (rationale.Length == 0)
        {
            return Failed("Rationale is required.");
        }

        SecurityEvidencePathRecord? path =
            await pathRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        if (path is null)
        {
            return Failed("Security evidence path was not found in the current scope.");
        }

        string actor = actorUserId.Trim();

        if (actor.Length == 0)
        {
            return Failed("Actor was not available.");
        }

        DateTime recordedUtc = TimeProvider.System.UtcNowDateTime();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SecureNowPilotPathDispositionRecorded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        pathId,
                        snapshotId = path.SnapshotId,
                        outcome,
                        rationale,
                        recordedUtc,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return new SecureNowPilotPathDispositionSaveResult
        {
            Succeeded = true,
            Disposition = new SecureNowPilotPathDispositionResponse
            {
                PathId = pathId,
                Outcome = outcome,
                Rationale = rationale,
                RecordedUtc = recordedUtc,
            },
        };
    }

    private static SecureNowPilotPathDispositionSaveResult Failed(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };

    private static SecureNowPilotPathDispositionResponse? TryParseDisposition(Guid pathId, AuditEvent auditEvent)
    {
        if (string.IsNullOrWhiteSpace(auditEvent.DataJson))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
            JsonElement root = document.RootElement;

            if (!root.TryGetProperty("pathId", out JsonElement pathIdElement))
            {
                return null;
            }

            if (!Guid.TryParse(pathIdElement.GetString(), out Guid storedPathId) || storedPathId != pathId)
            {
                return null;
            }

            string outcome = root.TryGetProperty("outcome", out JsonElement outcomeElement)
                ? outcomeElement.GetString()?.Trim() ?? string.Empty
                : string.Empty;
            string rationale = root.TryGetProperty("rationale", out JsonElement rationaleElement)
                ? rationaleElement.GetString()?.Trim() ?? string.Empty
                : string.Empty;

            if (outcome.Length == 0 || rationale.Length == 0)
            {
                return null;
            }

            DateTime recordedUtc = auditEvent.OccurredUtc;

            if (root.TryGetProperty("recordedUtc", out JsonElement recordedElement)
                && DateTime.TryParse(recordedElement.GetString(), out DateTime parsedRecordedUtc))
            {
                recordedUtc = parsedRecordedUtc;
            }

            return new SecureNowPilotPathDispositionResponse
            {
                PathId = pathId,
                Outcome = outcome,
                Rationale = rationale,
                RecordedUtc = recordedUtc,
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
