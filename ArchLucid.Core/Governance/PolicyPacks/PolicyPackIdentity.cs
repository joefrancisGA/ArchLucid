using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Stable identity helpers for policy packs (slug preferred; display name fallback).</summary>
public static class PolicyPackIdentity
{
    /// <summary>Returns the canonical slug when present; otherwise null.</summary>
    public static string? ResolveSlug(PolicyPack? pack)
    {
        if (pack is null)
            return null;

        return PolicyPackBundledSlugs.Normalize(pack.PackSlug);
    }

    /// <summary>Returns slug when set; otherwise uses trimmed display name for legacy rows.</summary>
    public static string ResolveMatchingKey(PolicyPack pack)
    {
        ArgumentNullException.ThrowIfNull(pack);

        string? slug = ResolveSlug(pack);

        if (slug is not null)
            return slug;

        return pack.Name.Trim();
    }
}
