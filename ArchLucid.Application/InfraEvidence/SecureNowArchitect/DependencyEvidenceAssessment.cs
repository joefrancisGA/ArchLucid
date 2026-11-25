namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Supplied by an authorized verifier, not by arbitrary advisory JSON.
// Completeness is scoped to an ecosystem and a dated catalog snapshot.
internal sealed record VerifiedDependencyCatalog(
    string EvidenceId, DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil,
    IReadOnlyList<VerifiedMaliciousVersion> Entries,
    IReadOnlySet<string> CompleteEcosystems);

internal sealed record DependencyAssessmentResult(
    bool InventoryParsedCompletely, bool CatalogCurrent,
    IReadOnlyList<(DependencyObservation Observation, DependencyMatch Match)> Findings);

internal static class DependencyEvidenceAssessment
{
    public static DependencyAssessmentResult AssessCycloneDx(
        string json, string artifactId, DateTimeOffset observedAt,
        VerifiedDependencyCatalog catalog, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        var inventory = CycloneDxDependencyEvidenceReader.Read(json, artifactId, observedAt);
        var current = !string.IsNullOrWhiteSpace(catalog.EvidenceId) &&
            catalog.VerifiedAt <= now && catalog.ValidUntil >= now &&
            catalog.ValidUntil >= catalog.VerifiedAt;
        IReadOnlyList<VerifiedMaliciousVersion> entries = current
            ? catalog.Entries.Where(a => a.VerifiedAt <= catalog.VerifiedAt).ToArray()
            : [];
        var findings = inventory.Observations.Select(observation =>
        {
            var complete = current && catalog.CompleteEcosystems.Contains(observation.Ecosystem)
                && entries.Count == catalog.Entries.Count;
            return (observation, MaliciousDependencyMatcher.Assess(
                observation, entries, now, complete));
        }).ToArray();
        return new(inventory.Complete, current, findings);
    }
}
