using ArchLucid.Core.Text;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Text;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EnglishNegationTokenizerTests
{
    [Theory]
    [InlineData("must not expose Redis to the internet")]
    [InlineData("do not require a public IP")]
    [InlineData("shouldn't allow SSH from 0.0.0.0/0")]
    [InlineData("teams mightn't configure encryption at rest")]
    [InlineData("workloads mightn't configure to use encryption at rest")]
    public void ContainsNegation_detects_realistic_architect_negation(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeTrue();
    }

    [Theory]
    [InlineData("workloads oughtn't provision encryption at rest")]
    [InlineData("workloads daren't configure encryption at rest")]
    [InlineData("workloads mayn't maintain encryption at rest")]
    [InlineData("workloads ain't implement encryption at rest")]
    public void ContainsNegation_covers_the_full_contraction_closed_class(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeTrue();
    }

    [Theory]
    [InlineData("teams not required to use encryption at rest")]
    [InlineData("teams not required for encryption at rest")]
    [InlineData("teams not necessary to use encryption at rest")]
    [InlineData("teams not necessary for encryption at rest")]
    [InlineData("no need to enable encryption at rest")]
    [InlineData("no requirement for encryption at rest")]
    public void ContainsNegation_detects_negated_requirements_regardless_of_preposition(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeTrue();
    }

    [Theory]
    [InlineData("require private endpoints")]
    [InlineData("might require NAT")]
    // A trailing word merely the same length as a suffix negation must not count as one:
    // "NAT" and "sql" are three letters, like "not".
    [InlineData("provision managed sql")]
    [InlineData("route egress through NAT")]
    [InlineData("requirements include private endpoints")]
    public void ContainsNegation_ignores_affirmative_requirements(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeFalse();
    }
}
