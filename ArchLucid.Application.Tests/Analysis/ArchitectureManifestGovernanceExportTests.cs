using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Suite", "Application")]
public sealed class ArchitectureManifestGovernanceExportTests
{
    [Fact]
    public void Format_classifications_use_not_stored_copy_for_schema_default_only()
    {
        ManifestGovernance governance = new()
        {
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
        };

        ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(governance)
            .Should()
            .Be(ArchitectureManifestGovernanceExport.RiskClassificationNotStoredLabel);
        ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(governance)
            .Should()
            .Be(ArchitectureManifestGovernanceExport.CostClassificationNotStoredLabel);
    }

    [Fact]
    public void Format_classifications_preserve_explicit_non_default_values()
    {
        ManifestGovernance governance = new()
        {
            RiskClassification = "High",
            CostClassification = "Low",
        };

        ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(governance).Should().Be("High");
        ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(governance).Should().Be("Low");
    }

    [Fact]
    public void Format_classifications_preserve_moderate_when_other_governance_fields_are_stored()
    {
        ManifestGovernance governance = new()
        {
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
            RequiredControls = ["MFA"],
        };

        ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(governance).Should().Be("Moderate");
        ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(governance).Should().Be("Moderate");
    }

    [Fact]
    public void Format_control_lists_use_not_stored_copy_when_empty()
    {
        ArchitectureManifestGovernanceExport.FormatRequiredControlsForExport([])
            .Should()
            .Be(ArchitectureManifestGovernanceExport.RequiredControlsNotStoredLabel);
        ArchitectureManifestGovernanceExport.FormatComplianceTagsForExport([])
            .Should()
            .Be(ArchitectureManifestGovernanceExport.ComplianceTagsNotStoredLabel);
        ArchitectureManifestGovernanceExport.FormatPolicyConstraintsForExport([])
            .Should()
            .Be(ArchitectureManifestGovernanceExport.PolicyConstraintsNotStoredLabel);
    }
}
