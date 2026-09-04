using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

/// <summary>
///     Configures authority/manifest-hash doubles so export paths pass sealed receipt verification.
/// </summary>
internal static class SealedExportReceiptTestSupport
{
    internal static IAuthorityQueryService CreateAuthorityQueryService(Guid runId, IManifestHashService manifestHashService)
    {
        Mock<IAuthorityQueryService> authority = new();
        ConfigureVerifiedSealedExport(authority, runId, manifestHashService);

        return authority.Object;
    }

    internal static void ConfigureVerifiedSealedExport(
        Mock<IAuthorityQueryService> authority,
        Guid runId,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(authority);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = "Architecture satisfies policy controls.",
            TransparencyTrail = new TransparencyTrail(),
        };

        ManifestDocument manifest = new()
        {
            ManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = runId,
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            ManifestHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
            Metadata = new ManifestMetadata { Version = "v1" },
            FeasibilityVerdict = verdict,
        };

        string hashBeforeReceipt = ManifestDecisionReceiptExportBinder.ComputeHashBeforeReceipt(manifest, manifestHashService);
        DecisionReceiptDocument sealedReceipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            hashBeforeReceipt,
            "v1");
        manifest.CommittedDecisionReceiptHashSha256 = sealedReceipt.ReceiptHashSha256;
        manifest.ManifestHash = manifestHashService.ComputeHash(manifest);

        authority
            .Setup(static s => s.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid requestedRunId, CancellationToken _) =>
                requestedRunId == runId
                    ? new RunDetailDto
                    {
                        Run = new RunRecord { RunId = runId },
                        GoldenManifest = manifest,
                    }
                    : null);
    }

    internal static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        if (Guid.TryParse(runId, out runGuid))
            return true;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out runGuid))
            return true;

        return false;
    }
}
