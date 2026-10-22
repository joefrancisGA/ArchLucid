namespace ArchLucid.Decisioning.Analysis;

/// <summary>One prior-vs-current security-semantic graph delta (DX-64).</summary>
public sealed record TopologySecurityDelta(
    TopologySecurityDeltaKind Kind,
    string NodeId,
    string NodeLabel,
    string? Detail);
