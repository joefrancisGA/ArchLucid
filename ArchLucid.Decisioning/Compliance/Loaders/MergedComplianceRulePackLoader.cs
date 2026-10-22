using System.Security.Cryptography;
using System.Text;

using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Compliance.Loaders;

/// <summary>
///     Loads multiple <see cref="IComplianceRulePackLoader" /> runs and merges rule lists for GA starter keys alongside
///     the legacy default pack.
/// </summary>
public sealed class MergedComplianceRulePackLoader(IReadOnlyList<IComplianceRulePackLoader> loaders) : IComplianceRulePackLoader
{
    private readonly IReadOnlyList<IComplianceRulePackLoader> _loaders =
        loaders ?? throw new ArgumentNullException(nameof(loaders));

    /// <inheritdoc />
    public async Task<ComplianceRulePack> LoadAsync(CancellationToken ct)
    {
        if (_loaders.Count == 0)
            throw new InvalidOperationException("At least one compliance rule pack loader is required.");

        List<ComplianceRule> rules = [];
        StringBuilder pathBuilder = new();
        StringBuilder hashMaterial = new();

        foreach (IComplianceRulePackLoader loader in _loaders)
        {
            ComplianceRulePack part = await loader.LoadAsync(ct);
            rules.AddRange(part.Rules);
            pathBuilder.Append(part.SourcePath).Append(';');
            hashMaterial.Append(part.RulePackHash).Append('|');
        }

        string combinedPaths = pathBuilder.ToString().TrimEnd(';');
        string fingerprint = hashMaterial.ToString();

        return new ComplianceRulePack
        {
            RulePackId = "archlucid-compliance-merged-v2",
            Name = "ArchLucid default + GA starter compliance rules",
            Version = "2.0.0",
            SourcePath = combinedPaths,
            RulePackHash = ComputeHexHash(fingerprint),
            Rules = rules
        };
    }

    private static string ComputeHexHash(string material)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(material);

        return Convert.ToHexString(SHA256.HashData(bytes));
    }
}
