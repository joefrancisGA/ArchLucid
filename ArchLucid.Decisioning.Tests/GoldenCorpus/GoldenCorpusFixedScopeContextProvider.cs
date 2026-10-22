using ArchLucid.Core.Scoping;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Stable tenant scope for golden-corpus effectful engines (no SQL).</summary>
internal sealed class GoldenCorpusFixedScopeContextProvider : IScopeContextProvider
{
    internal static ScopeContext Scope { get; } = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    public ScopeContext GetCurrentScope() => Scope;
}
