using System.Text.RegularExpressions;

using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>Lightweight HCL syntax checks when the Terraform CLI is unavailable on the API host.</summary>
public sealed class RegexTerraformValidator : ITerraformValidator
{
    private static readonly Regex ResourceBlockOpener = new(
        @"^\s*(resource|data|provider|module|terraform|variable|output|locals)\s+",
        RegexOptions.Compiled | RegexOptions.Multiline | RegexOptions.CultureInvariant);

    public TerraformValidationOutcome Validate(string hclBody)
    {
        if (string.IsNullOrWhiteSpace(hclBody))
            return TerraformValidationOutcome.Valid();

        if (!TryBalanceBraces(hclBody, out string? braceReason))
            return TerraformValidationOutcome.Invalid(braceReason!);

        if (!TryBalanceQuotesPerLine(hclBody, out string? quoteReason))
            return TerraformValidationOutcome.Invalid(quoteReason!);

        if (ContainsMalformedBlockHeader(hclBody))
            return TerraformValidationOutcome.Invalid("Malformed Terraform block header.");

        if (ContainsResourceBlockWithoutBody(hclBody))
            return TerraformValidationOutcome.Invalid("Terraform resource block is missing a body.");

        return TerraformValidationOutcome.Valid();
    }

    private static bool TryBalanceBraces(string hclBody, out string? reason)
    {
        int depth = 0;

        foreach (char ch in hclBody)
        {
            if (ch == '{')
                depth++;
            else if (ch == '}')
            {
                depth--;

                if (depth < 0)
                {
                    reason = "Unbalanced Terraform braces (unexpected '}').";
                    return false;
                }
            }
        }

        if (depth != 0)
        {
            reason = "Unbalanced Terraform braces.";
            return false;
        }

        reason = null;
        return true;
    }

    private static bool TryBalanceQuotesPerLine(string hclBody, out string? reason)
    {
        string[] lines = hclBody.Split('\n');

        foreach (string rawLine in lines)
        {
            string line = StripLineComments(rawLine);
            int quoteCount = 0;

            for (int i = 0; i < line.Length; i++)
            {
                if (line[i] != '"')
                    continue;

                if (i > 0 && line[i - 1] == '\\')
                    continue;

                quoteCount++;
            }

            if (quoteCount % 2 != 0)
            {
                reason = "Unclosed string literal in Terraform HCL.";
                return false;
            }
        }

        reason = null;
        return true;
    }

    private static string StripLineComments(string line)
    {
        int hash = line.IndexOf('#', StringComparison.Ordinal);

        if (hash < 0)
            return line;

        return line[..hash];
    }

    private static bool ContainsMalformedBlockHeader(string hclBody)
    {
        foreach (string rawLine in hclBody.Split('\n'))
        {
            string line = StripLineComments(rawLine).Trim();

            if (line.Length == 0)
                continue;

            if (!ResourceBlockOpener.IsMatch(line))
                continue;

            if (line.Contains('{', StringComparison.Ordinal))
                continue;

            if (line.StartsWith("terraform ", StringComparison.Ordinal) && !line.Contains('{', StringComparison.Ordinal))
                return true;

            if (line.StartsWith("locals ", StringComparison.Ordinal) && !line.Contains('{', StringComparison.Ordinal))
                return true;

            int quoteCount = line.Count(static ch => ch == '"');

            if (quoteCount > 0 && quoteCount < 2)
                return true;
        }

        return false;
    }

    private static bool ContainsResourceBlockWithoutBody(string hclBody)
    {
        foreach (string rawLine in hclBody.Split('\n'))
        {
            string line = StripLineComments(rawLine).Trim();

            if (line.Length == 0)
                continue;

            if (!line.StartsWith("resource ", StringComparison.Ordinal) &&
                !line.StartsWith("data ", StringComparison.Ordinal))
                continue;

            if (!line.Contains('{', StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
