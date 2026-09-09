using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.CareerArtifacts;

/// <summary>ADR 0039 — committed seal without transparency trail is a legacy re-export path (FC-75).</summary>
public static class LegacySealedReExportHonestyResolver
{
    public static bool Resolve(TransparencyTrail? transparencyTrail) => transparencyTrail is null;
}
