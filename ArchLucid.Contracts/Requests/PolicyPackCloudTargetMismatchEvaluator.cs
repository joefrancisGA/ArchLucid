using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Requests;

/// <summary>TB-2322 / robustness #7: fail-closed when cloud target and selected policy packs disagree.</summary>
public static class PolicyPackCloudTargetMismatchEvaluator
{
    public const string GenericMismatchMessage =
        "Selected policy packs may not match the stated cloud target. Adjust packs or cloud target before starting.";

    public static string? Evaluate(CloudProvider cloudProvider, IReadOnlyList<string>? policyReferences)
    {
        if (policyReferences is null || policyReferences.Count == 0)
            return null;

        string cloud = cloudProvider.ToString().Trim().ToLowerInvariant();
        List<string> refs = policyReferences
            .Select(static reference => reference.Trim().ToLowerInvariant())
            .Where(static reference => reference.Length > 0)
            .ToList();

        if (refs.Count == 0)
            return null;

        bool mentionsAzurePack = refs.Exists(static reference =>
            reference.Contains("azure", StringComparison.Ordinal)
            || reference.Contains("cis-azure", StringComparison.Ordinal));

        bool mentionsAwsPack = refs.Exists(static reference => reference.Contains("aws", StringComparison.Ordinal));
        bool mentionsGcpPack = refs.Exists(static reference =>
            reference.Contains("gcp", StringComparison.Ordinal)
            || reference.Contains("google", StringComparison.Ordinal));

        if (cloud == "aws" && mentionsAzurePack && !mentionsAwsPack)
        {
            return "Azure-focused policy packs are selected while the cloud target is AWS.";
        }

        if (cloud == "gcp" && mentionsAzurePack && !mentionsGcpPack)
        {
            return "Azure-focused policy packs are selected while the cloud target is Google Cloud.";
        }

        if (cloud == "none" && (mentionsAzurePack || mentionsAwsPack || mentionsGcpPack))
        {
            return "Cloud-specific policy packs are selected while the architecture is cloud-neutral.";
        }

        return null;
    }
}
