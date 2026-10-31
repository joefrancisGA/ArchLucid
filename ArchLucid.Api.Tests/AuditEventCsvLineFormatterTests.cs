using ArchLucid.Api.Formatters;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class AuditEventCsvLineFormatterTests
{
    [Fact]
    public void HeaderLine_includes_posture_columns()
    {
        AuditEventCsvLineFormatter.HeaderLine.Should().Contain("StructuralExecutionMode");
        AuditEventCsvLineFormatter.HeaderLine.Should().Contain("WorkingCareerRehearsalDoor");
        AuditEventCsvLineFormatter.HeaderLine.Should().Contain("RehearsalIncomplete");
    }

    [Fact]
    public void FormatEventLine_appends_posture_columns_when_stamp_present()
    {
        ExportFormatterService formatter = new();
        AuditEvent auditEvent = new()
        {
            EventId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"),
            OccurredUtc = DateTime.UtcNow,
            EventType = "RunCreated",
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
        };
        AuditExportCareerPostureStamp stamp = new("Simulator", "rehearsal", true);

        string line = AuditEventCsvLineFormatter.FormatEventLine(formatter, auditEvent, stamp);

        line.Should().EndWith("Simulator,rehearsal,True");
    }

    [Fact]
    public void FormatEventLine_labels_blank_scalar_fields_and_missing_posture_stamp()
    {
        ExportFormatterService formatter = new();
        AuditEvent auditEvent = new()
        {
            EventId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3"),
            OccurredUtc = DateTime.UtcNow,
            EventType = "RunCreated",
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
        };

        string line = AuditEventCsvLineFormatter.FormatEventLine(formatter, auditEvent, postureStamp: null);

        line.Should().Contain(AuditEventCsvLineFormatter.ActorUserIdNotStoredLabel);
        line.Should().Contain(AuditEventCsvLineFormatter.RunIdNotStoredLabel);
        line.Should().EndWith(
            $"{AuditEventCsvLineFormatter.StructuralExecutionModeNotStoredLabel},"
            + $"{AuditEventCsvLineFormatter.WorkingCareerRehearsalDoorNotStoredLabel},"
            + $"{AuditEventCsvLineFormatter.RehearsalIncompleteNotStoredLabel}");
    }
}
