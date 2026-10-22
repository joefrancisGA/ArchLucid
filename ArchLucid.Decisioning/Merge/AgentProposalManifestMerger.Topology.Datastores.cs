using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Merge;

public sealed partial class AgentProposalManifestMerger
{
    private static void MergeDatastores(
        GoldenManifest manifest,
        IReadOnlyCollection<ManifestDatastore> datastores,
        DecisionMergeResult output,
        AgentType agentType)
    {
        // Same O(1)-lookup pattern as MergeServices — avoids O(n²) FirstOrDefault scans.
        Dictionary<string, ManifestDatastore> byName = new(StringComparer.OrdinalIgnoreCase);

        // ReSharper disable once LoopCanBeConvertedToQuery — ToDictionary throws on duplicate keys; explicit overwrite is required.

        foreach (ManifestDatastore d in manifest.Datastores)
            byName[d.DatastoreName] = d;

        // ReSharper disable once LoopCanBeConvertedToQuery — side effects (trace recording, list and dictionary mutation) prevent safe LINQ conversion.

        foreach (ManifestDatastore datastore in datastores)
        {

            if (string.IsNullOrWhiteSpace(datastore.DatastoreName))
            {
                output.Warnings.Add($"Skipped unnamed datastore from {agentType}.");
                continue;
            }

            if (!byName.TryGetValue(datastore.DatastoreName, out ManifestDatastore? existing))
            {
                ManifestDatastore clone = CloneDatastore(datastore);
                manifest.Datastores.Add(clone);
                byName[clone.DatastoreName] = clone;

                DecisionMergeTraceRecorder.AddTrace(
                    output,
                    manifest.RunId,
                    "DatastoreAdded",
                    $"Added datastore '{datastore.DatastoreName}' from {agentType}.",
                    new Dictionary<string, string>
                    {
                        ["datastoreName"] = datastore.DatastoreName,
                        ["agentType"] = agentType.ToString()
                    });

                continue;
            }

            existing.EncryptionAtRestRequired |= datastore.EncryptionAtRestRequired;
            existing.PrivateEndpointRequired |= datastore.PrivateEndpointRequired;

            if (string.IsNullOrWhiteSpace(existing.Purpose) && !string.IsNullOrWhiteSpace(datastore.Purpose))
                existing.Purpose = datastore.Purpose;

            DecisionMergeTraceRecorder.AddTrace(
                output,
                manifest.RunId,
                "DatastoreMerged",
                $"Merged datastore '{existing.DatastoreName}' from {agentType}.",
                new Dictionary<string, string>
                {
                    ["datastoreName"] = existing.DatastoreName,
                    ["agentType"] = agentType.ToString()
                });
        }
    }
}
