using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Merge;

public sealed partial class AgentProposalManifestMerger
{
    private static void MergeServices(
        GoldenManifest manifest,
        IReadOnlyCollection<ManifestService> services,
        DecisionMergeResult output,
        AgentType agentType)
    {
        // Build an O(1) lookup before the loop and keep it current as services are added,
        // so successive agent passes do not re-scan the growing list (avoids O(n²)).
        // Overwrite on duplicate name is intentional — last writer wins for seeded entries.
        Dictionary<string, ManifestService> byName = new(StringComparer.OrdinalIgnoreCase);

        // ReSharper disable once LoopCanBeConvertedToQuery — ToDictionary throws on duplicate keys; explicit overwrite is required.

        foreach (ManifestService s in manifest.Services)
            byName[s.ServiceName] = s;

        // ReSharper disable once LoopCanBeConvertedToQuery — side effects (trace recording, list and dictionary mutation) prevent safe LINQ conversion.

        foreach (ManifestService service in services)
        {

            if (string.IsNullOrWhiteSpace(service.ServiceName))
            {
                output.Warnings.Add($"Skipped unnamed service from {agentType}.");
                continue;
            }

            if (!byName.TryGetValue(service.ServiceName, out ManifestService? existing))
            {
                ManifestService clone = CloneService(service);
                manifest.Services.Add(clone);
                byName[clone.ServiceName] = clone;

                DecisionMergeTraceRecorder.AddTrace(
                    output,
                    manifest.RunId,
                    "ServiceAdded",
                    $"Added service '{service.ServiceName}' from {agentType}.",
                    new Dictionary<string, string>
                    {
                        ["serviceName"] = service.ServiceName,
                        ["agentType"] = agentType.ToString()
                    });

                continue;
            }

            MergeServiceProperties(manifest.RunId, existing, service, output, agentType);
        }
    }

    private static void MergeServiceProperties(
        string runId,
        ManifestService existing,
        ManifestService incoming,
        DecisionMergeResult output,
        AgentType agentType)
    {
        if (string.IsNullOrWhiteSpace(existing.Purpose) && !string.IsNullOrWhiteSpace(incoming.Purpose))
            existing.Purpose = incoming.Purpose;

        existing.Tags = existing.Tags
            .Union(incoming.Tags, StringComparer.OrdinalIgnoreCase)
            .ToList();

        existing.RequiredControls = existing.RequiredControls
            .Union(incoming.RequiredControls, StringComparer.OrdinalIgnoreCase).ToList();

        DecisionMergeTraceRecorder.AddTrace(
            output,
            runId,
            "ServiceMerged",
            $"Merged service '{existing.ServiceName}' from {agentType}.",
            new Dictionary<string, string>
            {
                ["serviceName"] = existing.ServiceName,
                ["agentType"] = agentType.ToString()
            });
    }
}
