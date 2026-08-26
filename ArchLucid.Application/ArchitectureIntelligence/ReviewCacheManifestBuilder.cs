using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ReviewCacheManifestBuilder
{
    public static ReviewCacheDependencyManifest Build(
        ClosedLoopReasoningRequest request,
        ArchitectureKnowledgeModel? baselineKnowledgeModel = null,
        IReadOnlyList<TechnologyLedgerEntry>? technologyLedgerEntries = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new ReviewCacheDependencyManifest
        {
            ContentHash = HashContent(request, baselineKnowledgeModel, technologyLedgerEntries),
            PromptVersion = ArchitectureIntelligenceCacheVersions.PromptVersion,
            ModelVersion = ArchitectureIntelligenceCacheVersions.ModelVersion,
            PolicyPackVersion = ArchitectureIntelligenceCacheVersions.PolicyPackVersion,
            RubricVersion = ArchitectureIntelligenceCacheVersions.RubricVersion,
            TenantConfigurationHash = HashTenantConfiguration(request),
            DeclaredPrioritiesHash = HashPriorities(request.DeclaredPriorities),
            SchemaVersion = ArchitectureIntelligenceCacheVersions.SchemaVersion,
            ReuseReason = "closed-loop-full-run",
        };
    }

    private static string HashContent(
        ClosedLoopReasoningRequest request,
        ArchitectureKnowledgeModel? baselineKnowledgeModel,
        IReadOnlyList<TechnologyLedgerEntry>? technologyLedgerEntries)
    {
        StringBuilder builder = new();
        builder.Append("continue=").Append(request.ContinueFromExistingRun ? '1' : '0').Append('|');
        builder.Append("tier=").Append(request.ReviewTier.ToString()).Append('|');
        builder.Append("golden=").Append(request.UseGoldenFixture ? '1' : '0').Append('|');
        builder.Append("alias=").Append(request.ModelAliasId ?? string.Empty).Append('|');

        if (!string.IsNullOrWhiteSpace(request.RunId) && baselineKnowledgeModel is not null)
        {
            builder.Append("modelfp=")
                .Append(ReviewCacheModelFingerprint.Compute(baselineKnowledgeModel))
                .Append('|');
        }

        if (!string.IsNullOrWhiteSpace(request.RunId) && technologyLedgerEntries is not null)
        {
            builder.Append("ledgerfp=")
                .Append(ReviewCacheLedgerFingerprint.Compute(technologyLedgerEntries))
                .Append('|');
        }

        foreach (ClosedLoopReasoningSourceText source in request.SourceTexts
                     .OrderBy(item => item.FileName, StringComparer.Ordinal)
                     .ThenBy(item => item.ContentType, StringComparer.Ordinal))
        {
            builder.Append(source.FileName ?? string.Empty).Append('\n');
            builder.Append(source.ContentType ?? string.Empty).Append('\n');
            builder.Append(source.Content ?? string.Empty).Append("\n---\n");
        }

        foreach (KeyValuePair<string, string> answer in request.FramingAnswers
                     .OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            builder.Append(answer.Key).Append('=').Append(answer.Value).Append('\n');
        }

        return Sha256Hex(builder.ToString());
    }

    private static string HashTenantConfiguration(ClosedLoopReasoningRequest request)
    {
        string payload = string.Join(
            '|',
            request.TenantId ?? string.Empty,
            request.WorkspaceId ?? string.Empty,
            request.ProjectId ?? string.Empty);

        return Sha256Hex(payload);
    }

    private static string HashPriorities(IEnumerable<string> priorities)
    {
        string payload = string.Join(
            '|',
            priorities
                .Where(priority => !string.IsNullOrWhiteSpace(priority))
                .Select(priority => priority.Trim())
                .OrderBy(priority => priority, StringComparer.Ordinal));

        return Sha256Hex(payload);
    }

    private static string Sha256Hex(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
