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

    public static ReviewCacheDependencyManifest BuildWithResolvedRunId(
        ClosedLoopReasoningRequest request,
        string resolvedRunId,
        ArchitectureKnowledgeModel? baselineKnowledgeModel = null,
        IReadOnlyList<TechnologyLedgerEntry>? technologyLedgerEntries = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(resolvedRunId);

        ClosedLoopReasoningRequest resolvedRequest = ClosedLoopReasoningRequestSnapshot.Capture(request);
        resolvedRequest.RunId = ClosedLoopRunIdNormalizer.NormalizeRequired(resolvedRunId);

        return Build(resolvedRequest, baselineKnowledgeModel, technologyLedgerEntries);
    }

    public static ReviewCacheDependencyManifest BuildContinueFromExistingRunCoalesceManifest(
        ClosedLoopReasoningRequest request,
        string tenantId,
        string runId,
        ArchitectureKnowledgeModel? baselineKnowledgeModel = null,
        IReadOnlyList<TechnologyLedgerEntry>? technologyLedgerEntries = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string normalizedTenantId = ClosedLoopTenantIdNormalizer.NormalizeRequired(tenantId);
        string normalizedRunId = ClosedLoopRunIdNormalizer.NormalizeRequired(runId);

        ReviewCacheDependencyManifest contentManifest =
            Build(request, baselineKnowledgeModel, technologyLedgerEntries);

        return new ReviewCacheDependencyManifest
        {
            ContentHash = Sha256Hex($"continue|{normalizedTenantId}|{normalizedRunId}|{contentManifest.ContentHash}"),
            PromptVersion = contentManifest.PromptVersion,
            ModelVersion = contentManifest.ModelVersion,
            PolicyPackVersion = contentManifest.PolicyPackVersion,
            RubricVersion = contentManifest.RubricVersion,
            TenantConfigurationHash = contentManifest.TenantConfigurationHash,
            DeclaredPrioritiesHash = contentManifest.DeclaredPrioritiesHash,
            SchemaVersion = contentManifest.SchemaVersion,
            ReuseReason = "closed-loop-continue-existing",
        };
    }

    private static string HashContent(
        ClosedLoopReasoningRequest request,
        ArchitectureKnowledgeModel? baselineKnowledgeModel,
        IReadOnlyList<TechnologyLedgerEntry>? technologyLedgerEntries)
    {
        StringBuilder builder = new();

        if (request.ContinueFromExistingRun)
            builder.Append("continue=1|");

        builder.Append("tier=").Append(request.ReviewTier.ToString()).Append('|');
        builder.Append("golden=").Append(request.UseGoldenFixture ? '1' : '0').Append('|');
        builder.Append("alias=").Append(ClosedLoopModelAliasIdNormalizer.NormalizeForHash(request.ModelAliasId)).Append('|');

        if (!string.IsNullOrWhiteSpace(request.RunId))
        {
            builder.Append("modelfp=")
                .Append(ReviewCacheModelFingerprint.Compute(baselineKnowledgeModel ?? new ArchitectureKnowledgeModel()))
                .Append('|');
        }

        if (!string.IsNullOrWhiteSpace(request.RunId))
        {
            builder.Append("ledgerfp=")
                .Append(ReviewCacheLedgerFingerprint.Compute(technologyLedgerEntries))
                .Append('|');
        }

        foreach (ClosedLoopReasoningSourceText source in request.SourceTexts
                     .Select(ClosedLoopReasoningSourceTextNormalizer.Normalize)
                     .OrderBy(item => item.FileName, StringComparer.Ordinal)
                     .ThenBy(item => item.ContentType, StringComparer.Ordinal))
        {
            builder.Append(source.FileName).Append('\n');
            builder.Append(source.ContentType).Append('\n');
            builder.Append(source.Content ?? string.Empty).Append("\n---\n");
        }

        foreach (KeyValuePair<string, string> answer in ClosedLoopFramingAnswersNormalizer
                     .Normalize(request.FramingAnswers)
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
            ClosedLoopTenantIdNormalizer.NormalizeForHash(request.TenantId),
            ClosedLoopWorkspaceIdNormalizer.NormalizeForHash(request.WorkspaceId),
            ClosedLoopProjectIdNormalizer.NormalizeForHash(request.ProjectId));

        return Sha256Hex(payload);
    }

    private static string HashPriorities(IEnumerable<string> priorities)
    {
        string payload = string.Join(
            '|',
            ClosedLoopDeclaredPrioritiesNormalizer.Normalize(priorities));

        return Sha256Hex(payload);
    }

    private static string Sha256Hex(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
