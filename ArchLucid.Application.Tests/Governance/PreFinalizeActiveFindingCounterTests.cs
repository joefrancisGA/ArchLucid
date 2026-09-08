using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PreFinalizeActiveFindingCounterTests
{
    [Fact]
    public void Count_excludes_remediated_and_rejected_dispositions()
    {
        Finding criticalFinding = new()
        {
            FindingId = "finding-1",
            FindingType = "Security",
            Category = "Security",
            EngineType = "Test",
            Severity = FindingSeverity.Critical,
            Title = "Critical",
            Rationale = "Rationale",
        };

        Dictionary<string, Disposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["finding-1"] = Disposition.Remediated,
        };

        PreFinalizeActiveFindingCounter.Count([criticalFinding], FindingSeverity.Critical, dispositions)
            .Should()
            .Be(0);
    }

    [Fact]
    public void Count_includes_accepted_critical_findings()
    {
        Finding criticalFinding = new()
        {
            FindingId = "finding-1",
            FindingType = "Security",
            Category = "Security",
            EngineType = "Test",
            Severity = FindingSeverity.Critical,
            Title = "Critical",
            Rationale = "Rationale",
        };

        Dictionary<string, Disposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["finding-1"] = Disposition.Accepted,
        };

        PreFinalizeActiveFindingCounter.Count([criticalFinding], FindingSeverity.Critical, dispositions)
            .Should()
            .Be(1);
    }
}
