using ArchLucid.Core.Json;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Core.Tests.Json;

public sealed class JsonBooleanStringReaderPropertyTests
{
    private static readonly (string Input, bool Expected)[] Synonyms =
    [
        ("true", true),
        ("false", false),
        ("on", true),
        ("off", false),
        ("yes", true),
        ("no", false),
        ("enabled", true),
        ("disabled", false),
        (" TRUE ", true),
        (" Off ", false),
    ];

    [SkippableFact]
    public void Documented_synonyms_parse_to_expected_boolean()
    {
        foreach ((string input, bool expected) in Synonyms)
        {
            JsonBooleanStringReader.TryParseBooleanString(input, out bool value).Should().BeTrue();
            value.Should().Be(expected);
        }
    }

    [FsCheck.Xunit.Property(MaxTest = 120)]
    public Property Unrelated_tokens_return_false(NonEmptyString token)
    {
        string raw = token.Get;

        foreach ((string input, _) in Synonyms)
        {
            if (string.Equals(input.Trim(), raw.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return true.ToProperty();
            }
        }

        bool parsed = JsonBooleanStringReader.TryParseBooleanString(raw, out _);
        return (!parsed).ToProperty();
    }
}
