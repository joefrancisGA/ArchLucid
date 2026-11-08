using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;

namespace ArchLucid.Api.Formatters;

/// <summary>Shared RFC 4180-style CSV line formatting for audit export responses.</summary>
public static class AuditEventCsvLineFormatter
{
    public const string BaseHeaderLine =
        "EventId,OccurredUtc,EventType,ActorUserId,ActorUserName,RunId,ManifestId,CorrelationId,DataJson";

    public const string PostureColumns = "StructuralExecutionMode,WorkingCareerRehearsalDoor,RehearsalIncomplete";

    public const string HeaderLine = BaseHeaderLine + "," + PostureColumns;

    internal const string ActorUserIdNotStoredLabel = "Actor user id was not stored.";

    internal const string ActorUserNameNotStoredLabel = "Actor user name was not stored.";

    internal const string RunIdNotStoredLabel = "Run id was not stored.";

    internal const string ManifestIdNotStoredLabel = "Manifest id was not stored.";

    internal const string CorrelationIdNotStoredLabel = "Correlation id was not stored.";

    internal const string DataJsonNotStoredLabel = "Event data was not stored.";

    internal const string StructuralExecutionModeNotStoredLabel = "Structural execution mode was not stored.";

    internal const string WorkingCareerRehearsalDoorNotStoredLabel = "Working career rehearsal door was not stored.";

    internal const string RehearsalIncompleteNotStoredLabel = "Rehearsal incomplete flag was not stored.";

    /// <summary>
    /// Dual-channel honesty mirrored from UI audit export preamble (AUDIT_COVERAGE_MATRIX).
    /// </summary>
    public const string DualChannelHonestyNote =
        "This export lists durable SQL audit events only. Baseline orchestration also writes structured log-only mutation lines that do not populate dbo.AuditEvents — grep both channels during a security review.";

    public static string FormatEventLine(
        ExportFormatterService exportFormatter,
        AuditEvent auditEvent,
        AuditExportCareerPostureStamp? postureStamp = null)
    {
        ArgumentNullException.ThrowIfNull(exportFormatter);
        ArgumentNullException.ThrowIfNull(auditEvent);

        return string.Join(
            ',',
            EscapeCsvField(auditEvent.EventId.ToString("D", CultureInfo.InvariantCulture)),
            EscapeCsvField(exportFormatter.FormatIso8601Utc(auditEvent.OccurredUtc)),
            EscapeCsvField(auditEvent.EventType),
            EscapeCsvField(FormatOptionalField(auditEvent.ActorUserId, ActorUserIdNotStoredLabel)),
            EscapeCsvField(FormatOptionalField(auditEvent.ActorUserName, ActorUserNameNotStoredLabel)),
            EscapeCsvField(FormatNullableGuid(auditEvent.RunId, RunIdNotStoredLabel)),
            EscapeCsvField(FormatNullableGuid(auditEvent.ManifestId, ManifestIdNotStoredLabel)),
            EscapeCsvField(FormatOptionalField(auditEvent.CorrelationId, CorrelationIdNotStoredLabel)),
            EscapeCsvField(FormatOptionalField(auditEvent.DataJson, DataJsonNotStoredLabel)),
            EscapeCsvField(FormatStructuralExecutionMode(postureStamp)),
            EscapeCsvField(FormatWorkingCareerRehearsalDoor(postureStamp)),
            EscapeCsvField(FormatRehearsalIncomplete(postureStamp)));
    }

    public static async Task WriteHonestyPreambleAsync(
        TextWriter writer,
        AuditExportCareerPostureStamp? postureStamp,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(writer);

        await writer.WriteLineAsync("# ArchLucid audit CSV export posture (CG-026)".AsMemory(), cancellationToken);

        await writer.WriteLineAsync("# dualChannelHonesty=durableSqlLedgerOnly".AsMemory(), cancellationToken);
        await writer.WriteLineAsync(
            $"# dualChannelNote={DualChannelHonestyNote}".AsMemory(),
            cancellationToken);

        if (postureStamp is null)
        {
            await writer.WriteLineAsync(
                "# Run-scoped posture stamps apply when runId query filter is set.".AsMemory(),
                cancellationToken);
            await writer.WriteLineAsync(
                $"# postureColumnsWhenUnscoped={StructuralExecutionModeNotStoredLabel}".AsMemory(),
                cancellationToken);

            return;
        }

        await writer.WriteLineAsync(
            $"# structuralExecutionMode={postureStamp.StructuralExecutionMode}".AsMemory(),
            cancellationToken);
        await writer.WriteLineAsync(
            $"# workingCareerRehearsalDoor={postureStamp.WorkingCareerRehearsalDoor}".AsMemory(),
            cancellationToken);
        await writer.WriteLineAsync(
            $"# rehearsalIncomplete={FormatRehearsalIncomplete(postureStamp)}".AsMemory(),
            cancellationToken);
    }

    public static async Task WriteHeaderLineAsync(TextWriter writer, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(writer);

        await writer.WriteLineAsync(HeaderLine.AsMemory(), cancellationToken);
    }

    private static string FormatStructuralExecutionMode(AuditExportCareerPostureStamp? postureStamp)
    {
        if (postureStamp is null || string.IsNullOrWhiteSpace(postureStamp.StructuralExecutionMode))
        {
            return StructuralExecutionModeNotStoredLabel;
        }

        return postureStamp.StructuralExecutionMode.Trim();
    }

    private static string FormatWorkingCareerRehearsalDoor(AuditExportCareerPostureStamp? postureStamp)
    {
        if (postureStamp is null || string.IsNullOrWhiteSpace(postureStamp.WorkingCareerRehearsalDoor))
        {
            return WorkingCareerRehearsalDoorNotStoredLabel;
        }

        return postureStamp.WorkingCareerRehearsalDoor.Trim();
    }

    private static string FormatRehearsalIncomplete(AuditExportCareerPostureStamp? postureStamp)
    {
        if (postureStamp is null)
        {
            return RehearsalIncompleteNotStoredLabel;
        }

        return postureStamp.RehearsalIncomplete
            ? bool.TrueString
            : bool.FalseString;
    }

    private static string FormatNullableGuid(Guid? value, string notStoredLabel)
    {
        return !value.HasValue ? notStoredLabel : value.Value.ToString("D", CultureInfo.InvariantCulture);
    }

    private static string FormatOptionalField(string? value, string notStoredLabel)
    {
        return string.IsNullOrWhiteSpace(value) ? notStoredLabel : value.Trim();
    }

    private static string EscapeCsvField(string? value) => ExportFormatterService.EscapeCsvField(value);
}
