using System.Text.Json;

using ArchLucid.Core.Findings.Serialization;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Core.Tests.Findings.Serialization;

public sealed class FindingJsonNumericReadersPropertyTests
{
    private static readonly string[] BooleanSynonyms =
    [
        "true", "false", "on", "off", "yes", "no", "enabled", "disabled"
    ];

    [FsCheck.Xunit.Property(MaxTest = 80)]
    public Property Boolean_json_never_parses_as_int32()
    {
        return Prop.ForAll(Arb.Default.Bool(), value =>
        {
            using JsonDocument document = JsonDocument.Parse(value ? "true" : "false");
            bool accepted = FindingJsonNumericReaders.TryReadInt32(document.RootElement, out _);
            return (!accepted).ToProperty();
        });
    }

    [SkippableFact]
    public void Boolean_synonym_strings_never_parse_as_int32()
    {
        foreach (string synonym in BooleanSynonyms)
        {
            using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(synonym));
            FindingJsonNumericReaders.TryReadInt32(document.RootElement, out _).Should().BeFalse();
        }
    }

    [FsCheck.Xunit.Property(MaxTest = 80)]
    public Property Boolean_json_never_parses_as_finite_double()
    {
        return Prop.ForAll(Arb.Default.Bool(), value =>
        {
            using JsonDocument document = JsonDocument.Parse(value ? "true" : "false");
            bool accepted = FindingJsonNumericReaders.TryReadFiniteDouble(document.RootElement, out _);
            return (!accepted).ToProperty();
        });
    }
}
