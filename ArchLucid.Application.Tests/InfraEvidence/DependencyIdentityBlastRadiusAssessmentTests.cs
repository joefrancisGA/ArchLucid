using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DependencyIdentityBlastRadiusAssessmentTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(),
        Guid.NewGuid(), "resource", "generation", "python");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Request.TenantId, WorkspaceId = Request.WorkspaceId, ProjectId = Request.ProjectId
    };
    private static readonly DependencyObservation Observation = new("pypi", "example", "1.2.3",
        DependencyEvidenceKind.Installed, "artifact-proof", Now.AddMinutes(-1));
    private static readonly DependencyMatch Match = new(DependencyMatchState.Affected, ["advisory"], "artifact-proof");
    private static readonly VerifiedDependencyIdentityBinding Binding = new(Request, "artifact-proof",
        "identity", true, ["storage.read"], "identity-proof", Now.AddMinutes(-1), Now.AddMinutes(5));

    [Fact]
    public void Reports_only_evidenced_identity_capabilities()
    {
        var result = Assert.Single(Assess(Observation, Match, [Binding]));
        Assert.Equal("identity", result.IdentityId);
        Assert.Equal("identity-proof", result.BindingEvidenceId);
        Assert.Equal(new[] { "storage.read" }, result.GrantedCapabilities);
    }

    [Fact]
    public void Rejects_unexecuted_foreign_stale_or_unbound_artifacts()
    {
        foreach (var binding in new[]
        {
            Binding with { ArtifactExecuting = false },
            Binding with { ArtifactEvidenceId = "different-artifact" },
            Binding with { Scope = Request with { ProjectId = Guid.NewGuid() } },
            Binding with { Scope = Request with { DeploymentGeneration = "other" } },
            Binding with { ValidUntil = Now },
            Binding with { BindingEvidenceId = "" }
        })
            Assert.Empty(Assess(Observation, Match, [binding]));
        Assert.Empty(Assess(Observation with { Kind = DependencyEvidenceKind.Declared }, Match, [Binding]));
        Assert.Empty(Assess(Observation, Match with { State = DependencyMatchState.Unknown }, [Binding]));
        Assert.Empty(Assess(Observation, Match with { EvidenceId = "other" }, [Binding]));
        Assert.Empty(Assess(Observation, Match, [Binding, Binding with { ArtifactExecuting = false }]));
    }

    private static IReadOnlyList<DependencyIdentityExposure> Assess(DependencyObservation observation,
        DependencyMatch match, IReadOnlyList<VerifiedDependencyIdentityBinding> bindings) =>
        DependencyIdentityBlastRadiusAssessment.Assess(Scope, Request, observation, match, bindings,
            Now, TimeSpan.FromMinutes(5));
}
