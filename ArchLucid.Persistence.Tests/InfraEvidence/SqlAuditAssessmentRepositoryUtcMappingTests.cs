using System.Reflection;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SqlAuditAssessmentRepositoryUtcMappingTests
{
    [Fact]
    public void Map_restores_utc_kind_for_sql_datetime2_assessment_timestamps()
    {
        Type repositoryType = typeof(SqlAuditAssessmentRepository);
        Type rowType = repositoryType.GetNestedType("AssessmentRow", BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("Assessment row type was not found.");

        object row = Activator.CreateInstance(rowType, nonPublic: true)
            ?? throw new InvalidOperationException("Assessment row could not be created.");

        DateTime periodStart = new(2026, 9, 1, 10, 15, 0, DateTimeKind.Unspecified);
        DateTime periodEnd = new(2026, 9, 30, 22, 45, 0, DateTimeKind.Unspecified);
        DateTime created = new(2026, 8, 31, 7, 30, 0, DateTimeKind.Unspecified);

        Set(rowType, row, "PeriodStartUtc", periodStart);
        Set(rowType, row, "PeriodEndUtc", periodEnd);
        Set(rowType, row, "CreatedUtc", created);

        MethodInfo map = repositoryType.GetMethod("Map", BindingFlags.NonPublic | BindingFlags.Static)
            ?? throw new InvalidOperationException("Assessment mapper was not found.");

        AuditAssessmentRecord mapped = (AuditAssessmentRecord)(map.Invoke(null, [row])
            ?? throw new InvalidOperationException("Assessment mapper returned null."));

        mapped.PeriodStartUtc.Should().Be(periodStart);
        mapped.PeriodStartUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        mapped.PeriodEndUtc.Should().Be(periodEnd);
        mapped.PeriodEndUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        mapped.CreatedUtc.Should().Be(created);
        mapped.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
    }

    private static void Set(Type rowType, object row, string propertyName, object value) =>
        (rowType.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance)
            ?? throw new InvalidOperationException($"{propertyName} was not found."))
        .SetValue(row, value);
}
