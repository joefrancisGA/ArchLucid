using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Audit;

[Trait("Suite", "Core")]
public sealed class RequiredAuditTrailOrphanProbeSqlTests
{
    [Fact]
    public void Sql_fragments_reference_required_event_types_and_grace_parameters()
    {
        RequiredAuditTrailOrphanProbeSql.GovernanceApprovedMissingAudit.Should()
            .Contain("GovernanceApprovalApproved")
            .And.Contain("@GraceMinutes")
            .And.Contain("@LookbackDays");

        RequiredAuditTrailOrphanProbeSql.GovernanceRejectedMissingAudit.Should()
            .Contain("GovernanceApprovalRejected");

        RequiredAuditTrailOrphanProbeSql.GoldenManifestMissingFinalizedAudit.Should()
            .Contain("ManifestFinalized")
            .And.Contain("dbo.GoldenManifests");
    }

    [Fact]
    public void Probe_options_defaults_enable_bounded_scan()
    {
        RequiredAuditTrailProbeOptions options = new();

        options.OrphanProbeEnabled.Should().BeTrue();
        options.OrphanProbeIntervalMinutes.Should().Be(60);
        options.OrphanProbeGraceMinutes.Should().Be(15);
        options.OrphanProbeLookbackDays.Should().Be(7);
        RequiredAuditTrailProbeOptions.SectionName.Should().Be("RequiredAuditTrail");
    }
}
