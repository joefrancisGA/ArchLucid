using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryArmTolerantScalarDirectAccessArchitectureTests
{
    private static readonly Regex DirectBooleanValueKindCheck = new(
        @"JsonValueKind\.(True|False)\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex DirectNumericRead = new(
        @"\.TryGetInt32\(|\.TryGetInt64\(|\.GetBoolean\(",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly HashSet<string> AllowlistedRelativePaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "ArchLucid.Core/AzureExtractor/AzureInventoryArmTolerantScalarReader.cs",
        "ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs",
    };

    [Fact]
    public void Azure_inventory_extractors_route_arm_scalar_reads_through_tolerant_reader()
    {
        string repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string extractorRoot = Path.Combine(repoRoot, "ArchLucid.Core", "AzureExtractor");
        Directory.Exists(extractorRoot).Should().BeTrue();

        List<string> violations = [];

        foreach (string absolutePath in Directory.EnumerateFiles(extractorRoot, "*.cs", SearchOption.AllDirectories))
        {
            string relativePath = Path.GetRelativePath(repoRoot, absolutePath).Replace('\\', '/');

            if (AllowlistedRelativePaths.Contains(relativePath))
                continue;

            string[] lines = File.ReadAllLines(absolutePath);

            for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
            {
                string line = lines[lineIndex];

                if (DirectBooleanValueKindCheck.IsMatch(line) || DirectNumericRead.IsMatch(line))
                {
                    violations.Add($"{relativePath}:{lineIndex + 1}: {line.Trim()}");
                }
            }
        }

        violations.Should().BeEmpty(
            "ARM inventory extractors must coerce booleans and numbers via AzureInventoryArmTolerantScalarReader "
            + "(extend the reader or allowlist only non-inventory redaction helpers).");
    }
}
