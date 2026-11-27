namespace ArchLucid.Application.Analysis;

/// <summary>Positive witness for eligible cross-snapshot path carry-forward.</summary>
internal sealed record SecureNowDependencyReceipt(int Schema, Guid SnapshotId, string Evidence, string Configuration, string Paths);
