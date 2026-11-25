using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>TB-304 unit coverage for <see cref="ArchLucid.Api.Security.ScopeResolutionGuard" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopeResolutionGuardTests
{
    [Fact]
    public void RequiresTrustedScopeRejection_false_when_all_dimensions_from_claims()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeFalse();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_tenant_from_header()
    {
        Guid tenant = Guid.NewGuid();

        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext { TenantId = tenant, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new ScopeDimensionResolution(tenant, ScopeSource.Header),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_any_dimension_defaults()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
            },
            new ScopeDimensionResolution(ScopeIds.DefaultTenant, ScopeSource.Default),
            new ScopeDimensionResolution(ScopeIds.DefaultWorkspace, ScopeSource.Claim),
            new ScopeDimensionResolution(ScopeIds.DefaultProject, ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_ambient_uses_development_default_guids()
    {
        ScopeResolution resolution = ScopeResolution.FromUniformSource(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
            },
            ScopeSource.Ambient);

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Theory]
    [InlineData(ScopeSource.Claim, 0)]
    [InlineData(ScopeSource.Claim, 1)]
    [InlineData(ScopeSource.Claim, 2)]
    [InlineData(ScopeSource.Ambient, 0)]
    [InlineData(ScopeSource.Ambient, 1)]
    [InlineData(ScopeSource.Ambient, 2)]
    public void RequiresTrustedScopeRejection_rejects_each_individual_development_default(
        ScopeSource source, int dimension)
    {
        ScopeContext scope = new()
        {
            TenantId = dimension == 0 ? ScopeIds.DefaultTenant : Guid.NewGuid(),
            WorkspaceId = dimension == 1 ? ScopeIds.DefaultWorkspace : Guid.NewGuid(),
            ProjectId = dimension == 2 ? ScopeIds.DefaultProject : Guid.NewGuid(),
        };

        ScopeResolutionGuard.RequiresTrustedScopeRejection(
            ScopeResolution.FromUniformSource(scope, source)).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_accepts_explicit_nondefault_ambient_scope()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ScopeResolutionGuard.RequiresTrustedScopeRejection(
            ScopeResolution.FromUniformSource(scope, ScopeSource.Ambient)).Should().BeFalse();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_workspace_from_header()
    {
        Guid workspace = Guid.NewGuid();

        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = workspace, ProjectId = Guid.NewGuid() },
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(workspace, ScopeSource.Header),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_project_from_header()
    {
        Guid project = Guid.NewGuid();

        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = project },
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(project, ScopeSource.Header));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_claim_uses_development_default_guid()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            new ScopeDimensionResolution(ScopeIds.DefaultTenant, ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_tenant_claim_is_empty_guid()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = Guid.Empty,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            new ScopeDimensionResolution(Guid.Empty, ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_workspace_claim_is_empty_guid()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.NewGuid(),
            },
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.Empty, ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }

    [Fact]
    public void RequiresTrustedScopeRejection_true_when_project_claim_is_empty_guid()
    {
        ScopeResolution resolution = ScopeResolution.Create(
            new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.Empty,
            },
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.NewGuid(), ScopeSource.Claim),
            new ScopeDimensionResolution(Guid.Empty, ScopeSource.Claim));

        ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution).Should().BeTrue();
    }
}
