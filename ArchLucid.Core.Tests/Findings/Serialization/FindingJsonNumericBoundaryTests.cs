using System.Reflection;
using System.Text.Json;
using ArchLucid.Core.Findings.Serialization;
using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings.Serialization;

[Trait("Category", "Unit")]
public sealed class FindingJsonNumericBoundaryTests
{
    private static readonly Type Reader = typeof(FindingJsonConverter).Assembly
        .GetType("ArchLucid.Core.Findings.Serialization.FindingJsonNumericReaders", throwOnError: true)!;

    private static bool ParseLong(string raw, out long result)
    {
        MethodInfo method = Reader.GetMethod("TryParseWholeNumberLongString",
            BindingFlags.Static | BindingFlags.NonPublic)!;
        object?[] args = [raw, null];
        bool success = (bool)method.Invoke(null, args)!;
        result = success ? (long)args[1]! : default;
        return success;
    }

    [Theory]
    [InlineData("9007199254740993", 9007199254740993L)]
    [InlineData("9223372036854775807", long.MaxValue)]
    [InlineData("9.223372036854775807e18", long.MaxValue)]
    public void Int64_parsing_preserves_exact_large_integer(string raw, long expected)
    {
        ParseLong(raw, out long parsed).Should().BeTrue();
        parsed.Should().Be(expected);
    }

    [Theory]
    [InlineData("9223372036854775808")]
    [InlineData("9007199254740993.5")]
    [InlineData("NaN")]
    [InlineData("Infinity")]
    public void Int64_parsing_rejects_overflow_fraction_and_nonfinite(string raw)
    {
        ParseLong(raw, out _).Should().BeFalse();
    }

    [Theory]
    [InlineData("2147483648")]
    [InlineData("2147483647.5")]
    [InlineData("NaN")]
    public void Int32_string_parsing_rejects_invalid_boundaries(string raw)
    {
        MethodInfo method = Reader.GetMethod("TryParseWholeNumberString",
            BindingFlags.Static | BindingFlags.NonPublic)!;
        object?[] args = [raw, null];
        ((bool)method.Invoke(null, args)!).Should().BeFalse();
    }

    [Fact]
    public void Int32_json_token_rejects_rounded_out_of_range_value()
    {
        using JsonDocument doc = JsonDocument.Parse("2147483648");
        MethodInfo method = Reader.GetMethod("TryReadWholeNumberInt32",
            BindingFlags.Static | BindingFlags.NonPublic)!;
        object?[] args = [doc.RootElement, null];
        ((bool)method.Invoke(null, args)!).Should().BeFalse();
    }
}
