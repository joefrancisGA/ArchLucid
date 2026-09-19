using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses uploaded <c>.env</c> / <c>.env.example</c> extracts into proposed connection edges (SN-RT-09).
/// </summary>
public sealed class DotenvInfrastructureDeclarationParser(
    ILogger<DotenvInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "dotenv", StringComparison.OrdinalIgnoreCase);
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
                "Infrastructure declaration '{Name}' (dotenv) exceeds size cap ({MaxLength}); skipping.",
                declaration.Name,
                UploadedConfigProposedEdgeEmitter.MaxContentLength);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        List<CanonicalObject> results = [];

        foreach (string rawLine in declaration.Content.Split(
                     ["\n"],
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (rawLine.StartsWith('#'))
            {
                continue;
            }

            int separatorIndex = rawLine.IndexOf('=');

            if (separatorIndex <= 0)
            {
                continue;
            }

            string key = rawLine[..separatorIndex].Trim();
            string value = rawLine[(separatorIndex + 1)..].Trim();

            if (value.Length >= 2
                && ((value.StartsWith('"') && value.EndsWith('"'))
                    || (value.StartsWith('\'') && value.EndsWith('\''))))
            {
                value = value[1..^1];
            }

            UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                results,
                declaration,
                "dotenv",
                key,
                value);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }
}
