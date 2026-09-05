using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Audit;

[Trait("Suite", "Core")]
public sealed class RequiredAuditEventTypesTests
{
    [Fact]
    public void All_is_non_empty_and_aligned_with_ConstNames()
    {
        RequiredAuditEventTypes.All.Should().NotBeEmpty();
        RequiredAuditEventTypes.ConstNames.Should().HaveCount(RequiredAuditEventTypes.All.Count);
        RequiredAuditEventTypes.All.Should().OnlyHaveUniqueItems();
        RequiredAuditEventTypes.ConstNames.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void IsRequired_matches_registry_wire_values()
    {
        foreach (string wire in RequiredAuditEventTypes.All)
            RequiredAuditEventTypes.IsRequired(wire).Should().BeTrue(wire);

        RequiredAuditEventTypes.IsRequired(null).Should().BeFalse();
        RequiredAuditEventTypes.IsRequired("").Should().BeFalse();
        RequiredAuditEventTypes.IsRequired(AuditEventTypes.GovernanceDryRunValidationAttempted).Should().BeFalse();
        RequiredAuditEventTypes.IsRequired(AuditEventTypes.RunStarted).Should().BeFalse();
    }

    [Fact]
    public void IsRequired_trims_outer_whitespace_on_wire_values()
    {
        RequiredAuditEventTypes.IsRequired($"  {AuditEventTypes.GovernanceApprovalApproved}  ")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void All_includes_TB953_minimum_governance_and_identity_set()
    {
        RequiredAuditEventTypes.All.Should().Contain(
        [
            AuditEventTypes.GovernanceApprovalApproved,
            AuditEventTypes.GovernanceApprovalRejected,
            AuditEventTypes.GovernanceApprovalSubmitted,
            AuditEventTypes.ManifestFinalized,
            AuditEventTypes.IdentityCustomRoleAssigned,
            AuditEventTypes.ArchitectureDocxExportGenerated,
        ]);
    }
}
