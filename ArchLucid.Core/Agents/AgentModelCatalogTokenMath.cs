namespace ArchLucid.Core.Agents;

/// <summary>Engine-aware character→token estimation for pre-flight guards (TB-2107).</summary>
public static class AgentModelCatalogTokenMath
{
    public const int DefaultCharsPerToken = 4;

    public static int ResolveCharsPerToken(AgentModelAliasRegistryEntry? entry)
    {
        if (entry?.CharsPerToken is int charsPerToken and > 0)
        {
            return charsPerToken;
        }

        return DefaultCharsPerToken;
    }

    public static int EstimateTokensFromCharCount(int charCount, AgentModelAliasRegistryEntry? entry)
    {
        if (charCount <= 0)
        {
            return 0;
        }

        int charsPerToken = ResolveCharsPerToken(entry);

        return (int)Math.Ceiling(charCount / (double)charsPerToken);
    }
}
