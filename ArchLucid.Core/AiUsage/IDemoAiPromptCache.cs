namespace ArchLucid.Core.AiUsage;

public interface IDemoAiPromptCache
{
    bool TryGet(string cacheKey, out string responseJson);

    void Set(string cacheKey, string responseJson);
}
