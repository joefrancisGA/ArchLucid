using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailTrustEvidenceEnrichmentSlice(IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder) : IRunDetailEnrichmentSlice
{
    private readonly IRunTrustEvidenceCardBuilder _trustEvidenceCardBuilder =
        trustEvidenceCardBuilder ?? throw new ArgumentNullException(nameof(trustEvidenceCardBuilder));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        ArchitectureRunDetail architectureDetail = context.ArchitectureDetail
            ?? BuildBuyerArchitectureDetail(detail);

        if (!IsCommittedForTrust(detail, architectureDetail))
            return;

        try
        {
            detail.TrustEvidenceCard =
                await _trustEvidenceCardBuilder
                    .BuildAsync(architectureDetail, context.HostAgentExecutionMode, cancellationToken)
                    .ConfigureAwait(false);
        }
        catch (ConflictException)
        {
            // Sealed-hash mismatch must not fail GET /v1/authority/reviews/{runId}.
            // Demo seeds historically hashed Policy notes that were not persisted, so recomputation
            // 409'd the whole review page (and blocked re-run polling).
        }
    }

    private static bool IsCommittedForTrust(RunDetailDto detail, ArchitectureRunDetail architectureDetail)
    {
        if (architectureDetail.IsCommitted)
            return true;

        return detail.Run.GoldenManifestId.HasValue && detail.Run.GoldenManifestId.Value != Guid.Empty;
    }

    private static ArchitectureRunDetail BuildBuyerArchitectureDetail(RunDetailDto detail)
    {
        string runHex = detail.Run.RunId.ToString("N");

        return new ArchitectureRunDetail
        {
            Run = RunRecordToArchitectureRunMapper.ToArchitectureRun(detail.Run, []),
            Results = detail.Results ?? [],
            Manifest = BuildTrustManifestFromAuthorityDocument(runHex, detail.Run.ProjectId, detail.GoldenManifest),
        };
    }

    private static GoldenManifest BuildTrustManifestFromAuthorityDocument(
        string runHex,
        string? projectId,
        ManifestDocument? authorityManifest)
    {
        GoldenManifest manifest = new()
        {
            RunId = runHex,
            SystemName = projectId ?? string.Empty,
        };

        if (authorityManifest is null)
            return manifest;

        manifest.Metadata = new ManifestMetadata
        {
            ManifestVersion = string.IsNullOrWhiteSpace(authorityManifest.RuleSetVersion)
                ? authorityManifest.ManifestId.ToString("D")
                : authorityManifest.RuleSetVersion.Trim(),
            CreatedUtc = authorityManifest.CreatedUtc,
            ChangeDescription = string.Empty,
        };

        return manifest;
    }
}
