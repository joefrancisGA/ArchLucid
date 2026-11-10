using ArchLucid.Core.Json;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Core.Tests.Json;

[Trait("Category", "Unit")]
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
        ("1", true),
        ("0", false),
        (" 1 ", true),
        (" 0 ", false),
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

        // Recognized tokens (including numeric forms and trim/case variants)
        // are covered by the positive examples, not the negative property.
        bool recognized = Synonyms.Any(synonym =>
            string.Equals(synonym.Input.Trim(), raw.Trim(), StringComparison.OrdinalIgnoreCase)) ||
            raw.Trim() is "1" or "0";

        bool parsed = JsonBooleanStringReader.TryParseBooleanString(raw, out _);
        return (recognized || !parsed).ToProperty();
    }
}
