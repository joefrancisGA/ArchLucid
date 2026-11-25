using System.Text.Json;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record DependencyInventoryRead(
    IReadOnlyList<DependencyObservation> Observations, bool Complete);

internal static class CycloneDxDependencyEvidenceReader
{
    // The caller supplies the authenticated artifact identity and observation time.
    // An SBOM describes resolved components, not proof of installation or execution.
    public static DependencyInventoryRead Read(string json, string artifactId, DateTimeOffset observedAt)
    {
        if (string.IsNullOrWhiteSpace(artifactId)) return new([], false);
        var observations = new List<DependencyObservation>();
        bool complete = true;
        try
        {
            using var doc = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 64 });
            var root = doc.RootElement;
            if (String(root, "bomFormat") != "CycloneDX" ||
                !root.TryGetProperty("components", out var components) ||
                components.ValueKind != JsonValueKind.Array)
                return new([], false);
            // An artifact alone never establishes whole-estate inventory completeness.
            Visit(components);
            return new(observations.Distinct().ToArray(), complete);
        }
        catch (JsonException) { return new([], false); }

        void Visit(JsonElement array)
        {
            foreach (var component in array.EnumerateArray())
            {
                var purl = String(component, "purl");
                var version = String(component, "version");
                if (purl is not null && purl.StartsWith("pkg:", StringComparison.Ordinal) && purl.IndexOf('/') > 4)
                {
                    var slash = purl.IndexOf('/');
                    var ecosystem = purl[4..slash];
                    var body = purl[(slash + 1)..];
                    var at = body.LastIndexOf('@');
                    if (at > 0 && !body.Contains('?') && !body.Contains('#') &&
                        !body.Contains('%') &&
                        MaliciousDependencyMatcher.NormalizePackage(ecosystem, body[..at]) is not null &&
                        MaliciousDependencyMatcher.NormalizeVersion(ecosystem, version) is not null &&
                        string.Equals(body[(at + 1)..], version, StringComparison.Ordinal))
                        observations.Add(new(ecosystem, body[..at], version,
                            DependencyEvidenceKind.Resolved, artifactId, observedAt));
                    else complete = false;
                }
                else complete = false;
                if (component.ValueKind == JsonValueKind.Object &&
                    component.TryGetProperty("components", out var children))
                {
                    if (children.ValueKind == JsonValueKind.Array) Visit(children);
                    else complete = false;
                }
            }
        }
    }

    private static string? String(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object &&
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
}
