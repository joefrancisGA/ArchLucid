using System.Net;
using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Golden manifest fingerprinting and development seed helpers.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Commits a run and returns a content SHA-256 fingerprint of the committed <see cref="GoldenManifest" />
    ///     (excludes per-run identity fields — see <see cref="GoldenManifestFingerprint.ComputeContentSha256Hex" />).
    /// </summary>
    public async Task<GoldenManifestFingerprintResult?> TryCommitAndFingerprintGoldenManifestAsync(string runId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        try
        {
            Gen.CommitRunResponse gen = await _api.FinalizeAsync(runId, null, ct);
            Gen.GoldenManifest? gm = gen.Manifest;

            if (gm is null)
                return new GoldenManifestFingerprintResult(false, null, "Commit response contained no manifest.");

            string wireJson = JsonSerializer.Serialize(gm, gm.GetType(), _jsonOptions);
            JsonSerializerOptions contractRead = new(ContractJson.Default) { PropertyNameCaseInsensitive = true };
            GoldenManifest? manifest = JsonSerializer.Deserialize<GoldenManifest>(wireJson, contractRead);

            if (manifest is null)
                return new GoldenManifestFingerprintResult(false, null,
                    "Manifest could not be deserialized to GoldenManifest.");

            Gen.RunDetailsResponse runPayload = await _api.ReviewAsync(runId, ct);

            GoldenManifestCreateTimePinCommitment? createTimePins = null;

            if (runPayload.Run is not null)
            {
                string runWireJson = JsonSerializer.Serialize(runPayload.Run, runPayload.Run.GetType(), _jsonOptions);
                using JsonDocument runDoc = JsonDocument.Parse(runWireJson);
                JsonElement runElement = runDoc.RootElement;

                string? policyJson = runElement.TryGetProperty("pinnedPolicyPackIdsJson", out JsonElement policyElement)
                    ? policyElement.GetString()
                    : null;
                string? evidenceJson = runElement.TryGetProperty(
                        "pinnedEvidencePackagePinsJson",
                        out JsonElement evidenceElement)
                    ? evidenceElement.GetString()
                    : null;
                byte[]? evidenceHashBytes = runElement.TryGetProperty(
                        "pinnedEvidencePackagePinsHashSha256",
                        out JsonElement evidenceHash)
                    && evidenceHash.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(evidenceHash.GetString())
                    ? Convert.FromBase64String(evidenceHash.GetString()!)
                    : null;

                createTimePins = RunHeaderCreateTimePinCommitmentFactory.TryFromPinJson(
                    policyJson,
                    evidenceJson,
                    evidenceHashBytes);
            }

            IReadOnlyList<CommittedArtifactInventoryFingerprintRow>? inventoryRows = null;
            string commitWireJson = JsonSerializer.Serialize(gen, gen.GetType(), _jsonOptions);
            using JsonDocument commitDoc = JsonDocument.Parse(commitWireJson);

            if (commitDoc.RootElement.TryGetProperty("committedArtifactInventory", out JsonElement inventoryElement)
                && inventoryElement.ValueKind == JsonValueKind.Array)
            {
                inventoryRows = inventoryElement
                    .EnumerateArray()
                    .Select(static rowElement => new CommittedArtifactInventoryFingerprintRow(
                        rowElement.TryGetProperty("artifactName", out JsonElement nameElement)
                            ? nameElement.GetString() ?? string.Empty
                            : string.Empty,
                        rowElement.TryGetProperty("contentType", out JsonElement typeElement)
                            ? typeElement.GetString() ?? string.Empty
                            : string.Empty,
                        rowElement.TryGetProperty("contentHashSha256", out JsonElement hashElement)
                            ? hashElement.GetString() ?? string.Empty
                            : string.Empty,
                        rowElement.TryGetProperty("producer", out JsonElement producerElement)
                            ? producerElement.GetString() ?? string.Empty
                            : string.Empty,
                        rowElement.TryGetProperty("capturedUtc", out JsonElement capturedElement)
                            ? capturedElement.GetDateTime()
                            : DateTime.MinValue))
                    .ToList();
            }

            string sha = GoldenManifestFingerprint.ComputeContentSha256Hex(
                manifest,
                createTimePins,
                inventoryRows ?? []);

            return new GoldenManifestFingerprintResult(true, sha, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new GoldenManifestFingerprintResult(false, null, ResolveApiErrorMessage(ex), ex.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return new GoldenManifestFingerprintResult(false, null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new GoldenManifestFingerprintResult(false, null, "Request timed out.");
        }
        catch (ConflictException ex)
        {
            return new GoldenManifestFingerprintResult(false, null, ex.Message);
        }
        catch (FormatException ex)
        {
            return new GoldenManifestFingerprintResult(false, null,
                $"Run header pins could not be decoded: {ex.Message}");
        }
    }

    /// <summary>
    ///     Seed fake results for a run (Development only).
    /// </summary>
    public async Task<SeedFakeResultsResult?> SeedFakeResultsAsync(
        string runId,
        bool pilotTryRealModeFellBack = false,
        CancellationToken ct = default)
    {
        try
        {
            Gen.SeedFakeResultsResponse result = await _api.SeedFakeResultsAsync(runId, pilotTryRealModeFellBack, ct);
            SeedFakeResultsResponse? mapped = DeserializeRoundTrip<SeedFakeResultsResponse>(result);

            return new SeedFakeResultsResult(true, mapped?.ResultCount ?? 0, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new SeedFakeResultsResult(false, 0, ResolveApiErrorMessage(ex), ex.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return new SeedFakeResultsResult(false, 0, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new SeedFakeResultsResult(false, 0, "Request timed out.");
        }
    }
}
