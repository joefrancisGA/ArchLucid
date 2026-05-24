using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Indexes policy-pack compliance rule text from <c>templates/policy-packs/**/compliance-rules.json</c>.
/// </summary>
public sealed class PolicyPackCorpusIndexer(IOptionsMonitor<PolicyPackCorpusIndexerOptions> options)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IOptionsMonitor<PolicyPackCorpusIndexerOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public async Task<IReadOnlyList<RetrievalDocument>> BuildDocumentsAsync(CancellationToken ct)
    {
        PolicyPackCorpusIndexerOptions opts = _options.CurrentValue;
        string rulesFileName = string.IsNullOrWhiteSpace(opts.RulesFileName)
            ? "compliance-rules.json"
            : opts.RulesFileName.Trim();

        string packsRoot = ResolvePacksDirectory(opts.PolicyPacksDirectory);
        if (!Directory.Exists(packsRoot))
            return [];

        List<RetrievalDocument> documents = [];
        IEnumerable<string> ruleFiles = Directory.EnumerateFiles(packsRoot, rulesFileName, SearchOption.AllDirectories);

        foreach (string path in ruleFiles)
        {
            ct.ThrowIfCancellationRequested();

            await foreach (RetrievalDocument doc in ReadRuleDocumentsAsync(path, ct))
                documents.Add(doc);
        }

        return documents;
    }

    private static string ResolvePacksDirectory(string configured)
    {
        if (string.IsNullOrWhiteSpace(configured))
            configured = "templates/policy-packs";

        if (Path.IsPathRooted(configured))
            return configured;

        string relativeToBase = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configured));

        if (Directory.Exists(relativeToBase))
            return relativeToBase;

        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, configured.Replace('/', Path.DirectorySeparatorChar));

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return relativeToBase;
    }

    private static async IAsyncEnumerable<RetrievalDocument> ReadRuleDocumentsAsync(
        string filePath,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct)
    {
        await using FileStream stream = File.OpenRead(filePath);
        PolicyPackRulesFile? file = await JsonSerializer.DeserializeAsync<PolicyPackRulesFile>(stream, JsonOptions, ct);

        if (file?.Rules is null || file.Rules.Count == 0)
            yield break;

        string rulePackId = file.RulePackId ?? Path.GetFileName(Path.GetDirectoryName(filePath)) ?? "unknown";
        string version = file.Version ?? "0.0.0";
        DateTime createdUtc = File.GetLastWriteTimeUtc(filePath);

        foreach (PolicyPackRuleRow rule in file.Rules)
        {
            if (string.IsNullOrWhiteSpace(rule.RuleId))
                continue;

            string controlName = rule.ControlName ?? rule.RuleId;
            string description = rule.Description ?? string.Empty;
            string appliesTo = rule.AppliesToCategory ?? "general";
            string severity = rule.Severity ?? "Info";

            string content =
                $"[{rulePackId} v{version}] [{severity}] {controlName} ({appliesTo}): {description}";

            string hashInput = $"{rulePackId}|{version}|{rule.RuleId}|{description}";
            string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashInput)));

            yield return new RetrievalDocument
            {
                DocumentId = $"policy-pack-rule-{rulePackId}-{rule.RuleId}",
                TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                CorpusKind = CorpusKind.PolicyPack,
                SourceType = "PolicyPackRule",
                SourceId = rule.RuleId,
                Title = controlName,
                Content = content,
                ContentHash = contentHash,
                CreatedUtc = createdUtc,
            };
        }
    }

    private sealed class PolicyPackRulesFile
    {
        public string? RulePackId { get; set; }

        public string? Version { get; set; }

        public List<PolicyPackRuleRow>? Rules { get; set; }
    }

    private sealed class PolicyPackRuleRow
    {
        public string? RuleId { get; set; }

        public string? ControlName { get; set; }

        public string? AppliesToCategory { get; set; }

        public string? Severity { get; set; }

        public string? Description { get; set; }
    }
}
