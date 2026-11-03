using System.Globalization;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecureNowInvestigationEffortInputService(
    IAuditService auditService,
    IAuditRepository auditRepository) : ISecureNowInvestigationEffortInputService
{
    public const string FixtureWorksheetRejectedMessage =
        "Those values are the fixture worksheet.";

    public async Task<SecureNowInvestigationEffortInputsResponse?> TryGetLatestAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<AuditEvent> events = await auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            new AuditEventFilter
            {
                EventType = AuditEventTypes.SecureNowInvestigationEffortInputsRecorded,
                IncludeDataJson = true,
                Take = 20,
            },
            cancellationToken);

        foreach (AuditEvent auditEvent in events.OrderByDescending(item => item.OccurredUtc))
        {
            SecureNowInvestigationEffortInputsResponse? parsed = TryParseInputs(auditEvent);

            if (parsed is not null)
            {
                return parsed;
            }
        }

        return null;
    }

    public async Task<SecureNowInvestigationEffortInputsSaveResult> SaveAsync(
        ScopeContext scope,
        SecureNowInvestigationEffortInputsWriteRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (!TryNormalize(request, out SecureNowInvestigationEffortInputsResponse? normalized, out string? errorMessage))
        {
            return Failed(errorMessage ?? "Investigation effort inputs are invalid.");
        }

        string actor = actorUserId.Trim();

        if (actor.Length == 0)
        {
            return Failed("Actor was not available.");
        }

        DateTime recordedUtc = TimeProvider.System.UtcNowDateTime();
        SecureNowInvestigationEffortInputsResponse inputs = new()
        {
            BaselineHours = normalized!.BaselineHours,
            AfterHours = normalized.AfterHours,
            AnnualInvestigations = normalized.AnnualInvestigations,
            HourlyRate = normalized.HourlyRate,
            AnnualCost = normalized.AnnualCost,
            RecordedUtc = recordedUtc,
        };

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SecureNowInvestigationEffortInputsRecorded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        baselineHours = inputs.BaselineHours,
                        afterHours = inputs.AfterHours,
                        annualInvestigations = inputs.AnnualInvestigations,
                        hourlyRate = inputs.HourlyRate,
                        annualCost = inputs.AnnualCost,
                        recordedUtc,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return new SecureNowInvestigationEffortInputsSaveResult
        {
            Succeeded = true,
            Inputs = inputs,
        };
    }

    internal static bool TryNormalize(
        SecureNowInvestigationEffortInputsWriteRequest request,
        out SecureNowInvestigationEffortInputsResponse? normalized,
        out string? errorMessage)
    {
        normalized = null;
        errorMessage = null;

        if (!TryReadPositive(request.BaselineHours, "Baseline hours", out string baselineHours, out decimal baseline, out errorMessage)
            || !TryReadPositive(request.AfterHours, "After-product hours", out string afterHours, out decimal after, out errorMessage)
            || !TryReadPositive(request.AnnualInvestigations, "Annual investigations", out string annualInvestigations, out decimal annual, out errorMessage)
            || !TryReadPositive(request.HourlyRate, "Hourly rate", out string hourlyRate, out decimal rate, out errorMessage)
            || !TryReadPositive(request.AnnualCost, "Annual cost", out string annualCost, out decimal cost, out errorMessage))
        {
            return false;
        }

        if (baseline == 3m && after == 2m && annual == 20m && rate == 100m && cost == 10000m)
        {
            errorMessage = FixtureWorksheetRejectedMessage;
            return false;
        }

        normalized = new SecureNowInvestigationEffortInputsResponse
        {
            BaselineHours = baselineHours,
            AfterHours = afterHours,
            AnnualInvestigations = annualInvestigations,
            HourlyRate = hourlyRate,
            AnnualCost = annualCost,
        };
        return true;
    }

    private static bool TryReadPositive(
        string? raw,
        string label,
        out string stored,
        out decimal value,
        out string? errorMessage)
    {
        stored = raw?.Trim() ?? string.Empty;
        value = 0m;
        errorMessage = null;

        if (stored.Length == 0 || stored.Length > 32)
        {
            errorMessage = $"{label} must be a positive number.";
            return false;
        }

        if (!decimal.TryParse(stored, NumberStyles.Number, CultureInfo.InvariantCulture, out value) || value <= 0m)
        {
            errorMessage = $"{label} must be a positive number.";
            return false;
        }

        return true;
    }

    private static SecureNowInvestigationEffortInputsSaveResult Failed(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };

    private static SecureNowInvestigationEffortInputsResponse? TryParseInputs(AuditEvent auditEvent)
    {
        if (string.IsNullOrWhiteSpace(auditEvent.DataJson))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
            JsonElement root = document.RootElement;
            SecureNowInvestigationEffortInputsWriteRequest request = new()
            {
                BaselineHours = ReadString(root, "baselineHours"),
                AfterHours = ReadString(root, "afterHours"),
                AnnualInvestigations = ReadString(root, "annualInvestigations"),
                HourlyRate = ReadString(root, "hourlyRate"),
                AnnualCost = ReadString(root, "annualCost"),
            };

            if (!TryNormalize(request, out SecureNowInvestigationEffortInputsResponse? normalized, out _))
            {
                return null;
            }

            DateTime recordedUtc = auditEvent.OccurredUtc;

            if (root.TryGetProperty("recordedUtc", out JsonElement recordedElement)
                && DateTime.TryParse(recordedElement.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime parsedRecordedUtc))
            {
                recordedUtc = parsedRecordedUtc;
            }

            return new SecureNowInvestigationEffortInputsResponse
            {
                BaselineHours = normalized!.BaselineHours,
                AfterHours = normalized.AfterHours,
                AnnualInvestigations = normalized.AnnualInvestigations,
                HourlyRate = normalized.HourlyRate,
                AnnualCost = normalized.AnnualCost,
                RecordedUtc = recordedUtc,
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string ReadString(JsonElement root, string name) =>
        root.TryGetProperty(name, out JsonElement element) && element.ValueKind == JsonValueKind.String
            ? element.GetString() ?? string.Empty
            : string.Empty;
}
