namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>Resolves an engine-aware token counter for pre-flight sizing (TB-2107).</summary>
public interface ITokenCounterResolver
{
    ITokenCounter Resolve(string? modelAliasId);
}
