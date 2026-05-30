using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalIndexingScopeValidatorTests
{
    private static readonly Guid TenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceA = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectA = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void ValidateDocument_matching_scope_succeeds()
    {
        RetrievalDocument document = CreateTenantDocument(TenantA, WorkspaceA, ProjectA);
        ScopeContext scope = new() { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA };

        Action act = () => RetrievalIndexingScopeValidator.ValidateDocument(document, scope);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateDocument_mismatched_tenant_throws()
    {
        RetrievalDocument document = CreateTenantDocument(TenantA, WorkspaceA, ProjectA);
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
        };

        Action act = () => RetrievalIndexingScopeValidator.ValidateDocument(document, scope);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TenantId*");
    }

    [Fact]
    public void ValidateDocument_platform_policy_pack_bypasses_tenant_scope()
    {
        RetrievalDocument document = new()
        {
            DocumentId = "policy-1",
            TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            CorpusKind = CorpusKind.PolicyPack,
            Content = "rule text",
            CreatedUtc = DateTime.UtcNow,
        };

        ScopeContext scope = new() { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA };

        Action act = () => RetrievalIndexingScopeValidator.ValidateDocument(document, scope);

        act.Should().NotThrow();
    }

    private static RetrievalDocument CreateTenantDocument(Guid tenantId, Guid workspaceId, Guid projectId) =>
        new()
        {
            DocumentId = "doc-1",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "tenant scoped content",
            CreatedUtc = DateTime.UtcNow,
        };
}
