using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceAuditLineageResolverTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task Lineage_is_never_asserted_without_a_scoped_resource_match(bool suppliedIds, bool matching)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid resource = Guid.NewGuid(), assessment = Guid.NewGuid(), snapshot = Guid.NewGuid(), control = Guid.NewGuid();
        Mock<IAuditEvidenceSnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.ListLineageContextsByCloudResourceIdInScopeAsync(scope.ToProjectScopeKey(), resource,
                25, suppliedIds ? assessment : null, suppliedIds ? snapshot : null, suppliedIds ? control : null, CancellationToken.None))
            .ReturnsAsync(matching
                ? [new AuditEvidenceSnapshotLineageContextRecord
                    {
                        AssessmentId = assessment, AuditEvidenceSnapshotId = snapshot, ControlId = control,
                        ControlNumber = "AC-2", ControlTitle = "Account management", SnapshotCreatedUtc = DateTime.UtcNow,
                    }]
                : []);
        CloudResourceAuditLineageLink link = await new CloudResourceAuditLineageResolver(repository.Object).ResolveAsync(
            scope, resource, new CloudResourceEvidenceHubQuery
            {
                AssessmentId = suppliedIds ? assessment : null,
                AuditEvidenceSnapshotId = suppliedIds ? snapshot : null,
                ControlId = suppliedIds ? control : null,
            });

        link.Available.Should().Be(matching);
        if (matching)
        {
            link.AssessmentId.Should().Be(assessment);
            link.AuditEvidenceSnapshotId.Should().Be(snapshot);
            link.ControlId.Should().Be(control);
            link.ControlTitle.Should().Be("Account management");
            link.Matches.Should().ContainSingle();
        }
        else
        {
            link.AssessmentId.Should().BeNull();
            link.RelativePath.Should().BeNull();
            link.Matches.Should().BeEmpty();
            link.DegradedReason.Should().Contain("No audit evidence snapshot rows");
        }
    }
}
