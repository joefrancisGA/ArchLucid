namespace ArchLucid.Core.Costing;

/// <summary>Normalizes Terraform resource type strings to the short tail used by mappers.</summary>
internal static class TerraformTypeTail
{
    internal static ReadOnlySpan<char> Normalize(string terraformType)
    {
        ReadOnlySpan<char> s = terraformType.AsSpan().Trim();
        int slash = s.LastIndexOf('/');

        return slash >= 0 ? s[(slash + 1)..] : s;
    }
}
