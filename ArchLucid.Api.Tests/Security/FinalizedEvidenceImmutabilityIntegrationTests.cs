using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-322: committed review proof is immutable at the API boundary — sealed evidence cannot be rewritten and
///     mutating endpoints reject post-commit agent-result injection.
/// </summary>
[Trait("Category", "Slow")]
public sealed class FinalizedEvidenceImmutabilityIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Committed_run_rejects_agent_result_submission_and_preserves_golden_manifest_fingerprint()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-TB322-IMMUT-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();
        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        await commitResponse.EnsureSuccessForTestAsync();

        string fingerprintBefore = await GoldenManifestRawFingerprintAsync(runId);

        HttpResponseMessage secondCommit = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        secondCommit.StatusCode.Should().Be(HttpStatusCode.OK);
        string fingerprintAfterSecondCommit = await GoldenManifestRawFingerprintAsync(runId);
        fingerprintAfterSecondCommit.Should().Be(fingerprintBefore);

        AgentResult forgedResult = new()
        {
            ResultId = "tb322-forged-" + Guid.NewGuid().ToString("N"),
            TaskId = "tb322-task",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0.99,
            Claims = ["Fabricated post-commit evidence mutation attempt."],
        };

        HttpResponseMessage submitResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/result",
            JsonContent(new { result = forgedResult }));
        submitResponse.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Conflict);

        string fingerprintAfterSubmitAttempt = await GoldenManifestRawFingerprintAsync(runId);
        fingerprintAfterSubmitAttempt.Should().Be(fingerprintBefore);
    }

    [SkippableFact]
    public async Task Committed_run_execute_is_idempotent_and_does_not_change_stored_results()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-TB322-EXEC-IDEM")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage firstExecute = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        await firstExecute.EnsureSuccessForTestAsync();
        ExecuteRunResponseDto? firstPayload =
            await firstExecute.Content.ReadFromJsonAsync<ExecuteRunResponseDto>(JsonOptions);
        firstPayload.Should().NotBeNull();

        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        await commitResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage secondExecute = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        secondExecute.StatusCode.Should().Be(HttpStatusCode.OK);
        ExecuteRunResponseDto? secondPayload =
            await secondExecute.Content.ReadFromJsonAsync<ExecuteRunResponseDto>(JsonOptions);
        secondPayload.Should().NotBeNull();
        secondPayload!.Results.Should().HaveCount(firstPayload!.Results.Count);
    }

    private async Task<string> GoldenManifestRawFingerprintAsync(string runId)
    {
        HttpResponseMessage detailResponse = await Client.GetAsync($"/v1/authority/reviews/{runId}");
        await detailResponse.EnsureSuccessForTestAsync();
        string body = await detailResponse.Content.ReadAsStringAsync();

        using JsonDocument document = JsonDocument.Parse(body);

        if (!document.RootElement.TryGetProperty("goldenManifest", out JsonElement golden))
            throw new InvalidOperationException("Response missing goldenManifest (committed run expected).");

        byte[] utf8 = Encoding.UTF8.GetBytes(golden.GetRawText());

        return Convert.ToHexString(SHA256.HashData(utf8));
    }
}
