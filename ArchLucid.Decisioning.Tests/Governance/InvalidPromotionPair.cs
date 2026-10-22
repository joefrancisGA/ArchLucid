namespace ArchLucid.Decisioning.Tests.Governance;

/// <summary>Pair of governance environments that is not a valid single-step promotion.</summary>
public sealed record InvalidPromotionPair(string Source, string Target);
