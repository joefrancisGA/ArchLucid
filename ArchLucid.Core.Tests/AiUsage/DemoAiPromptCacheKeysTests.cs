using ArchLucid.Core.AiUsage;

namespace ArchLucid.Core.Tests.AiUsage;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoAiPromptCacheKeysTests
{
    [Fact]
    public void Build_DelimiterWithinPrompt_DistinguishesDifferentPromptPairs()
    {
        Assert.NotEqual(
            DemoAiPromptCacheKeys.Build("a\n---\nb", "c"),
            DemoAiPromptCacheKeys.Build("a", "b\n---\nc"));
    }

    [Fact]
    public void Build_SamePromptPair_IsDeterministic()
    {
        Assert.Equal(
            DemoAiPromptCacheKeys.Build("system", "user"),
            DemoAiPromptCacheKeys.Build("system", "user"));
    }

    [Fact]
    public void Build_NullPrompts_PreservesEmptyPromptEquivalence()
    {
        Assert.Equal(
            DemoAiPromptCacheKeys.Build(null, null),
            DemoAiPromptCacheKeys.Build(string.Empty, string.Empty));
    }
}
