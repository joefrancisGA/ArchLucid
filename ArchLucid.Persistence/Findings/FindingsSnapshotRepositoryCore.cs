using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Shared findings snapshot repository rules for in-memory and SQL implementations.
/// </summary>
public static class FindingsSnapshotRepositoryCore
{
    public const int MaxInMemoryEntries = 500;

    public static void PrepareSnapshotForSave(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        FindingsSnapshotMigrator.Apply(snapshot);
    }

    public static string? NormalizeFilter(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();

    public static Guid StableFindingRecordId(Guid findingsSnapshotId, int sortOrder, string findingId)
    {
        byte[] utf8 = Encoding.UTF8.GetBytes($"{findingsSnapshotId:N}:{sortOrder}:{findingId}");
        Span<byte> hash = stackalloc byte[32];

        SHA256.HashData(utf8, hash);

        return new Guid(hash[..16]);
    }

    public static ScopeContext? CaptureScopeAtSave(IScopeContextProvider? scopeContextProvider)
    {
        if (scopeContextProvider is null)
            return null;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        return scope;
    }

    public static bool ScopeMatches(ScopeContext saved, ScopeContext requested)
    {
        ArgumentNullException.ThrowIfNull(saved);
        ArgumentNullException.ThrowIfNull(requested);

        if (requested.TenantId == Guid.Empty)
            return true;

        return saved.TenantId == requested.TenantId
               && saved.WorkspaceId == requested.WorkspaceId
               && saved.ProjectId == requested.ProjectId;
    }
}
