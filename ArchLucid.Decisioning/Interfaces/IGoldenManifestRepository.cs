using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Interfaces;

public interface IGoldenManifestRepository
{
    Task SaveAsync(
        GoldenManifest manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<GoldenManifest?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct);
}

