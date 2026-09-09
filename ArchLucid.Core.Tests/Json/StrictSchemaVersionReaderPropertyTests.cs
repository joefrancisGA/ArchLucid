using System.Text.Json;

using ArchLucid.Core.Json;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Core.Tests.Json;

public sealed class StrictSchemaVersionReaderPropertyTests
{
    private static readonly string[] BooleanSynonyms =
    [
        "true", "false", "on", "off", "yes", "no", "enabled", "disabled", "TRUE", " On "
    ];

    [FsCheck.Xunit.Property(MaxTest = 80)]
    public Property Boolean_json_never_parses_as_schema_version()
    {
        return Prop.ForAll(Arb.Default.Bool(), value =>
        {
            using JsonDocument document = JsonDocument.Parse(value ? "true" : "false");
            bool accepted = StrictSchemaVersionReader.TryReadSchemaVersion(document.RootElement, out _);
            return (!accepted).ToProperty();
        });
    }

    [SkippableFact]
    public void Boolean_synonym_strings_never_parse_as_schema_version()
    {
        foreach (string synonym in BooleanSynonyms)
        {
            using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(synonym));
            StrictSchemaVersionReader.TryReadSchemaVersion(document.RootElement, out _).Should().BeFalse();
        }
    }

    [FsCheck.Xunit.Property(MaxTest = 200)]
    public Property Non_negative_whole_numbers_in_safe_range_round_trip(PositiveInt n)
    {
        int value = n.Get % 1_000_000;
        using JsonDocument document = JsonDocument.Parse(value.ToString());
        bool accepted = StrictSchemaVersionReader.TryReadSchemaVersion(document.RootElement, out int parsed);
        return (accepted && parsed == value).ToProperty();
    }
}
