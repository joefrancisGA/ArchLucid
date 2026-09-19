using System.Text.RegularExpressions;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Docker Compose <c>environment:</c> map extracts into proposed connection edges (SN-RT-09).
/// </summary>
public sealed partial class ComposeEnvInfrastructureDeclarationParser(
    ILogger<ComposeEnvInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "compose-env", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (declaration.Content.Length > UploadedConfigProposedEdgeEmitter.MaxContentLength)
        {
            logger.LogWarning(
                "Infrastructure declaration '{Name}' (compose-env) exceeds size cap ({MaxLength}); skipping.",
                declaration.Name,
                UploadedConfigProposedEdgeEmitter.MaxContentLength);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        List<CanonicalObject> results = [];
        string? serviceName = null;
        bool inEnvironmentBlock = false;
        int environmentIndent = -1;

        foreach (string rawLine in declaration.Content.Split(["\n"], StringSplitOptions.None))
        {
            string trimmed = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
            {
                continue;
            }

            int indent = rawLine.Length - rawLine.TrimStart().Length;
            if (IsComposeStructuralKey(trimmed))
            {
                if (string.Equals(trimmed, "environment:", StringComparison.OrdinalIgnoreCase))
                {
                    inEnvironmentBlock = true;
                    environmentIndent = indent;
                }
                else
                {
                    inEnvironmentBlock = false;
                    environmentIndent = -1;
                }

                continue;
            }

            Match serviceMatch = ComposeServiceHeaderRegex().Match(trimmed);

            if (serviceMatch.Success)
            {
                serviceName = serviceMatch.Groups["name"].Value.Trim();
                inEnvironmentBlock = false;
                environmentIndent = -1;

                continue;
            }

            if (!inEnvironmentBlock)
            {
                continue;
            }

            if (indent <= environmentIndent && !trimmed.StartsWith('-'))
            {
                inEnvironmentBlock = false;

                continue;
            }

            Match mapMatch = EnvironmentMapEntryRegex().Match(trimmed);

            if (mapMatch.Success)
            {
                string key = mapMatch.Groups["key"].Value.Trim();
                string value = mapMatch.Groups["value"].Value.Trim();

                UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                    results,
                    declaration,
                    "compose-env",
                    string.IsNullOrWhiteSpace(serviceName) ? key : $"{serviceName}:{key}",
                    value,
                    fromLabel: serviceName);

                continue;
            }

            Match inlineMapMatch = EnvironmentInlineMapEntryRegex().Match(trimmed);

            if (inlineMapMatch.Success)
            {
                string key = inlineMapMatch.Groups["key"].Value.Trim();
                string value = inlineMapMatch.Groups["value"].Value.Trim();

                UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                    results,
                    declaration,
                    "compose-env",
                    string.IsNullOrWhiteSpace(serviceName) ? key : $"{serviceName}:{key}",
                    value,
                    fromLabel: serviceName);

                continue;
            }

            Match listMatch = EnvironmentListEntryRegex().Match(trimmed);

            if (listMatch.Success)
            {
                string entry = listMatch.Groups["entry"].Value.Trim();
                int separatorIndex = entry.IndexOf('=');

                if (separatorIndex <= 0)
                {
                    continue;
                }

                string key = entry[..separatorIndex].Trim();
                string value = entry[(separatorIndex + 1)..].Trim();

                UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                    results,
                    declaration,
                    "compose-env",
                    string.IsNullOrWhiteSpace(serviceName) ? key : $"{serviceName}:{key}",
                    value,
                    fromLabel: serviceName);
            }
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    [GeneratedRegex(@"^(?<name>[A-Za-z0-9_.-]+):\s*$", RegexOptions.CultureInvariant)]
    private static partial Regex ComposeServiceHeaderRegex();

    private static bool IsComposeStructuralKey(string trimmed)
    {
        return trimmed.Equals("services:", StringComparison.OrdinalIgnoreCase)
               || trimmed.Equals("environment:", StringComparison.OrdinalIgnoreCase)
               || trimmed.Equals("version:", StringComparison.OrdinalIgnoreCase)
               || trimmed.Equals("networks:", StringComparison.OrdinalIgnoreCase)
               || trimmed.Equals("volumes:", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(@"^-\s*""?(?<key>[^:""\s]+)""?\s*:\s*""?(?<value>.*?)""?\s*$", RegexOptions.CultureInvariant)]
    private static partial Regex EnvironmentMapEntryRegex();

    [GeneratedRegex(@"^""?(?<key>[A-Za-z0-9_.-]+)""?\s*:\s*(?<value>.+?)\s*$", RegexOptions.CultureInvariant)]
    private static partial Regex EnvironmentInlineMapEntryRegex();

    [GeneratedRegex(@"^-\s*(?<entry>.+)$", RegexOptions.CultureInvariant)]
    private static partial Regex EnvironmentListEntryRegex();
}
