using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class ExecutiveBusinessImpactCategoryClassifierTests
{
    [Fact]
    public void Build_buckets_security_compliance_and_reliability_themes()
    {
        List<ArchitectureFinding> findings =
        [
            Finding("Security hardening"),
            Finding("Compliance gap"),
            Finding("Privacy control"),
            Finding("Reliability risk"),
            Finding("Availability concern"),
            Finding("Cost optimization"),
        ];

        ExecutiveBusinessImpactCategoryCounts counts =
            ExecutiveBusinessImpactCategoryClassifier.Build(findings);

        counts.SecurityComplianceThemeCount.Should().Be(3);
        counts.ReliabilityThemeCount.Should().Be(2);
    }

    [Fact]
    public void Build_returns_zero_when_no_matching_categories()
    {
        ExecutiveBusinessImpactCategoryCounts counts =
            ExecutiveBusinessImpactCategoryClassifier.Build([Finding("Cost optimization")]);

        counts.SecurityComplianceThemeCount.Should().Be(0);
        counts.ReliabilityThemeCount.Should().Be(0);
    }

    private static ArchitectureFinding Finding(string category) => new()
    {
        FindingId = Guid.NewGuid().ToString("N"),
        Category = category,
        Message = "sample",
        Severity = FindingSeverity.Warning,
        SourceAgent = AgentType.Topology,
    };
}
