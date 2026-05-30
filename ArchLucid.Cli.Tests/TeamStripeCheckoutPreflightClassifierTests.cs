using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TeamStripeCheckoutPreflightClassifierTests
{
    [Fact]
    public void Classify_placeholder_url()
    {
        TeamStripeCheckoutPreflightClassifier.Classify(
                "https://checkout.stripe.com/placeholder-replace-before-launch")
            .Should()
            .Be(TeamStripeCheckoutPreflightClassifier.Placeholder);
    }

    [Fact]
    public void Classify_test_mode_url()
    {
        TeamStripeCheckoutPreflightClassifier.Classify("https://buy.stripe.com/test_abc123")
            .Should()
            .Be(TeamStripeCheckoutPreflightClassifier.TestMode);
    }

    [Fact]
    public void Classify_live_candidate_url()
    {
        TeamStripeCheckoutPreflightClassifier.Classify("https://buy.stripe.com/live_abc123")
            .Should()
            .Be(TeamStripeCheckoutPreflightClassifier.LiveCandidate);
    }
}
