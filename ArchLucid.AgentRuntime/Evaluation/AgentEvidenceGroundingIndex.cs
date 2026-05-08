using System.Text;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Flattened evidence text plus per-ref blobs for AgentResult grounding heuristics.</summary>
internal static class AgentEvidenceGroundingIndex
{
    internal sealed class Index
    {
        private readonly Dictionary<string, string> _refBlobById;

        internal Index(string fullBlob, Dictionary<string, string> refBlobById)
        {
            FullBlob = fullBlob;
            _refBlobById = refBlobById;
        }

        internal string FullBlob
        {
            get;
        }

        internal string ResolveRefsBlob(IReadOnlyList<string> refs)
        {
            if (refs.Count == 0)
                return string.Empty;

            StringBuilder sb = new();

            foreach (string r in refs)
            {
                if (_refBlobById.TryGetValue(r, out string? blob))

                    _ = sb.Append(blob).Append(' ');
            }

            return sb.ToString().Trim();
        }
    }

    internal static Index Build(AgentEvidencePackage evidence)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);
        StringBuilder sb = new();

        Append(sb, evidence.SystemName);
        Append(sb, evidence.Environment);
        Append(sb, evidence.CloudProvider);
        Append(sb, evidence.Request.Description);

        foreach (string c in evidence.Request.Constraints ?? [])
            Append(sb, c);

        foreach (PolicyEvidence p in evidence.Policies)
        {
            Append(sb, p.PolicyId);
            Append(sb, p.Title);
            Append(sb, p.Summary);

            foreach (string c in p.RequiredControls)

                Append(sb, c);

            string blob = $"{p.PolicyId} {p.Title} {p.Summary}".ToLowerInvariant();
            map[p.PolicyId] = blob;
        }

        foreach (ServiceCatalogEvidence s in evidence.ServiceCatalog)
        {
            Append(sb, s.ServiceId);
            Append(sb, s.ServiceName);
            Append(sb, s.Category);
            Append(sb, s.Summary);

            foreach (string t in s.Tags)

                Append(sb, t);

            string blob =
                $"{s.ServiceId} {s.ServiceName} {s.Category} {s.Summary}".ToLowerInvariant();
            map[s.ServiceId] = blob;
        }

        foreach (PatternEvidence p in evidence.Patterns)
        {
            Append(sb, p.PatternId);
            Append(sb, p.Name);
            Append(sb, p.Summary);

            foreach (string svc in p.SuggestedServices)

                Append(sb, svc);

            map[p.PatternId] = $"{p.PatternId} {p.Name} {p.Summary}".ToLowerInvariant();
        }

        if (evidence.PriorManifest is { } prior)
        {
            Append(sb, prior.ManifestVersion);
            Append(sb, prior.Summary);

            foreach (string svc in prior.ExistingServices)

                Append(sb, svc);

            foreach (string ds in prior.ExistingDatastores)

                Append(sb, ds);

            foreach (string c in prior.ExistingRequiredControls)

                Append(sb, c);
        }

        foreach (EvidenceNote note in evidence.Notes)

            Append(sb, note.Message);

        string full = sb.ToString().ToLowerInvariant();

        return new Index(full, map);

        static void Append(StringBuilder b, string? s)
        {
            if (string.IsNullOrWhiteSpace(s))

                return;

            b.Append(' ');
            b.Append(s);
        }
    }
}
