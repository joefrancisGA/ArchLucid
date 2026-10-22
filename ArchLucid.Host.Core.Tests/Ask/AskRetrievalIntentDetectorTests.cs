using ArchLucid.Host.Core.Services.Ask;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskRetrievalIntentDetectorTests
{
    [Theory]
    [InlineData("Which compliance controls apply?", true)]
    [InlineData("Explain our governance policy", true)]
    [InlineData("What is the network topology?", false)]
    public void DetectPolicyPackIntent_matches_keywords(string question, bool expected)
    {
        AskRetrievalIntentDetector.DetectPolicyPackIntent(question).Should().Be(expected);
    }

    [Theory]
    [InlineData("Why did the architecture change over time?", true)]
    [InlineData("What was the previous decision?", true)]
    [InlineData("Summarize current cost findings", false)]
    public void DetectPriorManifestIntent_matches_keywords(string question, bool expected)
    {
        AskRetrievalIntentDetector.DetectPriorManifestIntent(question).Should().Be(expected);
    }

    [Theory]
    [InlineData("Which ADR defines CorpusKind?", true)]
    [InlineData("What does V1 scope say about RAG?", true)]
    [InlineData("Summarize current cost findings", false)]
    public void DetectPlatformDocIntent_matches_keywords(string question, bool expected)
    {
        AskRetrievalIntentDetector.DetectPlatformDocIntent(question).Should().Be(expected);
    }
}
