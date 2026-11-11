using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.User;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     End-to-end simulator path vs locked <c>cohort.json</c> expectations. Skips unless
///     <c>ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED=true</c> and SHAs in the cohort file are non-placeholder.
/// </summary>
[Trait("Category", "Slow")]
[Trait("Suite", "GoldenCohort")]
public sealed class GoldenCohortSimulatorDriftTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Simulator_path_matches_locked_baseline_when_enabled()
    {
        Skip.IfNot(
            string.Equals(
                Environment.GetEnvironmentVariable("ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED"),
                "true",
                StringComparison.OrdinalIgnoreCase));

        string cohortPath = Path.Combine(AppContext.BaseDirectory, "golden-cohort", "cohort.json");
        Assert.True(File.Exists(cohortPath),
            $"Missing {cohortPath} (link tests/golden-cohort/cohort.json in project).");

        GoldenCohortDocument document = GoldenCohortDocument.Load(cohortPath);
        bool hasPlaceholder = document.Items.Any(static item =>
            string.Equals(
                item.ExpectedCommittedManifestSha256.Trim(),
                GoldenCohortBaselineConstants.UnlockedManifestSha256Placeholder,
                StringComparison.OrdinalIgnoreCase));

        if (hasPlaceholder)
        {
            Assert.Fail(
                "ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED is true but cohort.json still contains SHA placeholders. "
                + "Clear the repository variable or run `archlucid golden-cohort lock-baseline --write` after owner approval (PENDING_QUESTIONS item 33).");
        }

        // Simulator SHA lock is Guided/eval (ADR 0086), not Working career export. Default workspace
        // mode is Working, which applies the 47-engine career-export floor and blocks finalize.
        HttpResponseMessage workspaceModeResponse = await Client.PutAsync(
            "/v1/user/preferences/workspace-mode",
            JsonContent(new SetWorkspaceModeRequest { Mode = WorkspaceModeValues.Guided }));
        await workspaceModeResponse.EnsureSuccessForTestAsync();

        int cap = document.Items.Count;
        string? capRaw = Environment.GetEnvironmentVariable("ARCHLUCID_GOLDEN_COHORT_DRIFT_ITEM_CAP");

        if (int.TryParse(capRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsedCap) && parsedCap > 0
            && parsedCap < cap)
            cap = parsedCap;

        List<GoldenCohortDriftRow> rows = [];

        for (int i = 0; i < cap; i++)
        {
            GoldenCohortItem item = document.Items[i];

            HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(GoldenCohortArchitectureRequestFactory.FromCohortItem(item));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
            created.Should().NotBeNull();

            string runId = created.Run.RunId;

            await ExecuteForTestAsync(runId);
            HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId);
            CommitRunResponse commitPayload =
                await commitResponse.ReadJsonForTestAsync<CommitRunResponse>(JsonOptions);
            GoldenManifest manifest = commitPayload.Manifest;

            manifest.Should().NotBeNull();

            JsonElement reviewRoot = await Client.GetRunReviewJsonForTestAsync(runId, JsonOptions);
            JsonElement runElement = reviewRoot.GetProperty("run");
            HarnessRunPinHeader pinHeader =
                runElement.Deserialize<HarnessRunPinHeader>(JsonOptions)
                ?? throw new InvalidOperationException("Golden cohort review response did not include a run pin header.");
            string? pinnedEvidencePackagePinsHashSha256 = pinHeader.PinnedEvidencePackagePinsHashSha256;

            RunRecord header = new()
            {
                PinnedPolicyPackIdsJson = pinHeader.PinnedPolicyPackIdsJson,
                PinnedEvidencePackagePinsJson = pinHeader.PinnedEvidencePackagePinsJson,
                PinnedEvidencePackagePinsHashSha256 =
                    !string.IsNullOrWhiteSpace(pinnedEvidencePackagePinsHashSha256)
                    ? Convert.FromBase64String(pinnedEvidencePackagePinsHashSha256)
                    : null,
            };

            GoldenManifestCreateTimePinCommitment? createTimePins =
                RunHeaderCreateTimePinCommitmentFactory.TryFromRunHeader(header);

            IReadOnlyList<CommittedArtifactInventoryFingerprintRow>? inventoryRows = null;

            if (commitPayload.CommittedArtifactInventory.Count > 0)
            {
                List<Core.Manifest.Sections.CommittedArtifactInventoryEntry> entries =
                    commitPayload.CommittedArtifactInventory
                        .Select(static row =>
                            new Core.Manifest.Sections.CommittedArtifactInventoryEntry
                            {
                                ArtifactName = row.ArtifactName,
                                ContentType = row.ContentType,
                                ContentHashSha256 = row.ContentHashSha256,
                                Producer = row.Producer,
                                CapturedUtc = row.CapturedUtc,
                            })
                        .ToList();

                inventoryRows = CommittedArtifactInventoryFingerprintProjector.FromEntries(entries);
            }

            string actualSha = GoldenManifestFingerprint.ComputeContentSha256Hex(
                manifest,
                createTimePins,
                inventoryRows ?? []);
            string expectedSha = item.ExpectedCommittedManifestSha256.Trim();
            bool shaMatches = string.Equals(actualSha, expectedSha, StringComparison.OrdinalIgnoreCase);

            GetRunResponseDto? runPayload =
                JsonSerializer.Deserialize<GetRunResponseDto>(reviewRoot.GetRawText(), JsonOptions);
            runPayload.Should().NotBeNull();

            string resultsJson = JsonSerializer.Serialize(runPayload.Results, JsonOptions);
            List<AgentResult>? typedResults = JsonSerializer.Deserialize<List<AgentResult>>(resultsJson, JsonOptions);

            typedResults.Should().NotBeNull();

            SortedSet<string> actualCategories =
                GoldenCohortFindingCategoryAggregator.DistinctCategories(typedResults);
            SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

            foreach (string c in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
            {
                expectedCategories.Add(c.Trim());
            }

            bool categoryMatches = actualCategories.SetEquals(expectedCategories);

            rows.Add(
                new GoldenCohortDriftRow(
                    item.Id,
                    expectedSha,
                    actualSha,
                    shaMatches,
                    string.Join(", ", expectedCategories),
                    string.Join(", ", actualCategories),
                    categoryMatches));
        }

        string preamble =
            "Simulator path: POST /v1/architecture/request → execute → commit; "
            + "SHA from `GoldenManifestFingerprint.ComputeContentSha256Hex` (excludes RunId/CreatedUtc/DecisionTraceIds); "
            + "categories from distinct finding categories across agent results after execute.";

        string markdown = GoldenCohortDriftMarkdown.BuildReport(TimeProvider.System.GetUtcNow(), rows, preamble);
        // Compact table stays under FluentAssertions MaxLines so all 20 SHA actuals appear in CI logs.
        string compact = GoldenCohortDriftMarkdown.BuildCompactShaTable(rows);
        Console.WriteLine(compact);
        await WriteDriftDiagnosticsAsync(markdown, compact, rows);

        rows.Should().OnlyContain(static r => r.ShaMatches && r.CategoryMatches, compact);
    }

    private async Task WriteDriftDiagnosticsAsync(
        string markdown,
        string compact,
        IReadOnlyList<GoldenCohortDriftRow> rows)
    {
        string? reportRoot = Environment.GetEnvironmentVariable("ARCHLUCID_GOLDEN_COHORT_DRIFT_REPORT_ROOT");

        if (!string.IsNullOrWhiteSpace(reportRoot))
        {
            Directory.CreateDirectory(reportRoot);
            string latestPath = Path.Combine(reportRoot, "golden-cohort-drift-latest.md");
            await File.WriteAllTextAsync(latestPath, markdown);

            // Machine-readable actuals for operator re-lock after intentional content-hasher changes.
            string actualsPath = Path.Combine(reportRoot, "golden-cohort-drift-actuals.json");
            string actualsJson = JsonSerializer.Serialize(
                rows.Select(static r => new { id = r.ItemId, committedManifestSha256 = r.ActualSha.ToLowerInvariant() }),
                JsonOptions);
            await File.WriteAllTextAsync(actualsPath, actualsJson);
        }

        string? summaryPath = Environment.GetEnvironmentVariable("GITHUB_STEP_SUMMARY");

        if (string.IsNullOrWhiteSpace(summaryPath))
            return;

        await File.AppendAllTextAsync(
            summaryPath,
            markdown + Environment.NewLine + compact + Environment.NewLine);
    }
}
