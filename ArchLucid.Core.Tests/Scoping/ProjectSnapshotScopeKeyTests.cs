using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProjectSnapshotScopeKeyTests
{
    [Fact]
    public void Create_preserves_project_authority_and_snapshot_identity()
    {
        ProjectScopeKey project = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid snapshotId = Guid.NewGuid();

        ProjectSnapshotScopeKey key = ProjectSnapshotScopeKey.Create(project, snapshotId);

        key.Project.Should().Be(project);
        key.TenantId.Should().Be(project.TenantId);
        key.WorkspaceId.Should().Be(project.WorkspaceId);
        key.ProjectId.Should().Be(project.ProjectId);
        key.SnapshotId.Should().Be(snapshotId);
    }

    [Fact]
    public void Create_rejects_missing_project_or_snapshot()
    {
        ProjectScopeKey project = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Action missingProject = () => ProjectSnapshotScopeKey.Create(null!, Guid.NewGuid());
        Action missingSnapshot = () => ProjectSnapshotScopeKey.Create(project, Guid.Empty);

        missingProject.Should().Throw<ArgumentNullException>();
        missingSnapshot.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(typeof(ISecurityEvidencePathRankRepository))]
    [InlineData(typeof(ISecurityEvidenceCutPointRepository))]
    [InlineData(typeof(ISecurityEvidencePathRepository))]
    public void Snapshot_read_repository_boundary_requires_validated_key(Type repositoryType)
    {
        System.Reflection.MethodInfo method = repositoryType.GetMethod("ListBySnapshotAsync")!;

        method.GetParameters()[0].ParameterType.Should().Be(typeof(ProjectSnapshotScopeKey));
        method.GetParameters().Should().NotContain(parameter => parameter.ParameterType == typeof(Guid),
            "snapshot reads must not accept loose authority or snapshot identifiers");
    }
}
