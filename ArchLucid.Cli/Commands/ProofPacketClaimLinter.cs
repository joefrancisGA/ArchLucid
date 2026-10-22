using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Deterministic claim lint for buyer-safe proof-packet markdown/text artifacts (assessment §17 #12).
/// </summary>
internal static class ProofPacketClaimLinter
{
    private const string DefaultRulesFileName = "proof_packet_claim_lint_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static IReadOnlyList<ProofPacketClaimLintViolation> ScanDirectory(string outputDirectory, string? rulesFilePath = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);

        ClaimLintRules rules = LoadRules(rulesFilePath);
        string root = Path.GetFullPath(outputDirectory);
        List<ProofPacketClaimLintViolation> violations = [];

        foreach (string filePath in Directory.EnumerateFiles(root, "*.*", SearchOption.AllDirectories))
        {
            string extension = Path.GetExtension(filePath);

            if (!rules.ScanExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                continue;

            string relativePath = Path.GetRelativePath(root, filePath).Replace('\\', '/');
            string content = File.ReadAllText(filePath);

            violations.AddRange(ScanText(content, relativePath, rules));
        }

        return violations
            .OrderBy(v => v.RelativeFilePath, StringComparer.Ordinal)
            .ThenBy(v => v.LineNumber)
            .ToList();
    }

    internal static IReadOnlyList<ProofPacketClaimLintViolation> ScanText(
        string content,
        string sourceLabel,
        string? rulesFilePath = null)
    {
        ClaimLintRules rules = LoadRules(rulesFilePath);

        return ScanText(content, sourceLabel, rules);
    }

    private static IReadOnlyList<ProofPacketClaimLintViolation> ScanText(string content, string sourceLabel, ClaimLintRules rules)
    {
        ArgumentNullException.ThrowIfNull(content);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceLabel);
        ArgumentNullException.ThrowIfNull(rules);

        List<ProofPacketClaimLintViolation> violations = [];
        string[] lines = content.Split('\n');

        for (int index = 0; index < lines.Length; index++)
        {
            string line = lines[index];
            string normalized = NormalizeLine(line);

            if (LineHasMarker(normalized, rules.CaveatMarkers) || LineHasMarker(normalized, rules.AllowedLabelMarkers))
                continue;

            foreach (ForbiddenClaimRule rule in rules.ForbiddenClaims)
            {
                if (!normalized.Contains(rule.Phrase, StringComparison.Ordinal))
                    continue;

                violations.Add(
                    new ProofPacketClaimLintViolation(
                        sourceLabel,
                        index + 1,
                        rule.Phrase,
                        rule.Reason,
                        rule.SuggestedSafeWording));

                break;
            }
        }

        return violations;
    }

    internal static void WriteViolations(TextWriter writer, IReadOnlyList<ProofPacketClaimLintViolation> violations)
    {
        ArgumentNullException.ThrowIfNull(writer);
        ArgumentNullException.ThrowIfNull(violations);

        writer.WriteLine("Proof-packet claim lint failed — unsupported buyer-facing claims detected:");

        foreach (ProofPacketClaimLintViolation violation in violations)
            writer.WriteLine(violation.RenderLine());

        writer.WriteLine();
        writer.WriteLine("Fix the generated artifact text or API source content, then regenerate the proof packet.");
        writer.WriteLine("Internal-only bypass: pass --skip-claim-lint (not for sponsor send).");
    }

    private static ClaimLintRules LoadRules(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        ClaimLintRules? rules = JsonSerializer.Deserialize<ClaimLintRules>(json, JsonRead);

        if (rules is null || rules.ForbiddenClaims.Count == 0)
            throw new InvalidOperationException($"Proof-packet claim lint rules are missing or empty: {path}");

        if (rules.ScanExtensions.Count == 0)
        {
            rules.ScanExtensions.Add(".md");
            rules.ScanExtensions.Add(".txt");
        }

        return rules;
    }

    private static string ResolveDefaultRulesPath()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "Data", DefaultRulesFileName);

        if (File.Exists(bundled))
            return bundled;

        string repoRelative = Path.GetFullPath(
            Path.Combine(baseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", DefaultRulesFileName));

        if (File.Exists(repoRelative))
            return repoRelative;

        throw new FileNotFoundException(
            $"Proof-packet claim lint rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }

    private static string NormalizeLine(string line)
    {
        string normalized = line;

        foreach (char marker in new[] { '*', '_', '`' })
            normalized = normalized.Replace(marker.ToString(), string.Empty, StringComparison.Ordinal);

        return normalized.ToLowerInvariant();
    }

    private static bool LineHasMarker(string normalizedLine, IReadOnlyList<string> markers)
    {
        foreach (string marker in markers)
        {
            if (normalizedLine.Contains(marker, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private sealed record ClaimLintRules
    {
        public List<string> ScanExtensions
        {
            get;
            init;
        } = [];

        public List<ForbiddenClaimRule> ForbiddenClaims
        {
            get;
            init;
        } = [];

        public List<string> CaveatMarkers
        {
            get;
            init;
        } = [];

        public List<string> AllowedLabelMarkers
        {
            get;
            init;
        } = [];
    }

    private sealed record ForbiddenClaimRule
    {
        public string Phrase
        {
            get;
            init;
        } = null!;

        public string Reason
        {
            get;
            init;
        } = null!;

        public string SuggestedSafeWording
        {
            get;
            init;
        } = null!;
    }
}
