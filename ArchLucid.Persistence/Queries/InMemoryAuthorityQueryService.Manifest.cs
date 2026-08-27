using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

public sealed partial class InMemoryAuthorityQueryService
{
    /// <inheritdoc />
    public async Task<ManifestSummaryDto?> GetManifestSummaryAsync(ScopeContext scope, Guid manifestId,
        CancellationToken ct)
    {
        ManifestDocument? manifest = await goldenManifestRepository.GetByIdAsync(scope, manifestId, ct);
        return manifest is null ? null : AuthorityRunMapper.MapManifestSummary(manifest);
    }
}
