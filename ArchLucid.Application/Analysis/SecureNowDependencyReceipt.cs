namespace ArchLucid.Application.Analysis;

/// <summary>Witness for an exact complete search domain, including an empty path set.</summary>
internal sealed record SecureNowDependencyReceipt(int Schema, Guid SnapshotId, string Evidence, string Configuration, string Paths)
{
    internal const int CurrentSchema = 3;
}
