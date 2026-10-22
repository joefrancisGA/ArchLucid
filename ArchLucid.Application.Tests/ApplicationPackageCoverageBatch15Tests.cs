using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch15Tests
{
    [Theory]
    [InlineData("ThrottlingException: rate exceeded", true)]
    [InlineData("Request failed", false)]
    public void HostedAwsExtractorFailureClassifier_detects_throttling_messages(string message, bool expected)
    {
        Exception exception = new InvalidOperationException(message);

        HostedAwsExtractorFailureClassifier.IsThrottled(exception).Should().Be(expected);
        HostedAwsExtractorFailureClassifier.Describe(exception).Should().Be(message);
    }

    [Theory]
    [InlineData("RESOURCE_EXHAUSTED: quota", true)]
    [InlineData("Quota exceeded for project", true)]
    [InlineData("Client hit rate limit", true)]
    [InlineData("Permission denied", false)]
    public void HostedGcpExtractorFailureClassifier_detects_throttling_messages(string message, bool expected)
    {
        Exception exception = new InvalidOperationException(message);

        HostedGcpExtractorFailureClassifier.IsThrottled(exception).Should().Be(expected);
        HostedGcpExtractorFailureClassifier.Describe(exception).Should().Be(message);
    }

    [Fact]
    public void HostedAzureExtractorHttpFailureClassifier_detects_429_and_ignores_other_status_codes()
    {
        HttpRequestException throttled = new("Too many requests", inner: null, statusCode: HttpStatusCode.TooManyRequests);
        HttpRequestException serverError = new("Server error", inner: null, statusCode: HttpStatusCode.InternalServerError);
        InvalidOperationException nonHttp = new("not http");

        HostedAzureExtractorHttpFailureClassifier.IsArmThrottled(throttled).Should().BeTrue();
        HostedAzureExtractorHttpFailureClassifier.IsArmThrottled(serverError).Should().BeFalse();
        HostedAzureExtractorHttpFailureClassifier.IsArmThrottled(nonHttp).Should().BeFalse();
        HostedAzureExtractorHttpFailureClassifier.Describe(throttled).Should().Be("Too many requests");
    }

    [Fact]
    public void QuickScanLlmSystemPrompt_exposes_non_empty_scanner_instructions()
    {
        QuickScanLlmSystemPrompt.Text.Should().Contain("findings");
        QuickScanLlmSystemPrompt.Text.Should().Contain("raw JSON");
    }

    [Theory]
    [InlineData("CostOptimization", "finding-type:OrphanedAzureResource", null, true)]
    [InlineData("CostOptimization", "engine:orphaned-azure-resource", null, true)]
    [InlineData("CostOptimization", "orphan-candidate:azure-resource", null, true)]
    [InlineData("CostOptimization", "finding-type:OrphanedAwsResource", null, true)]
    [InlineData("CostOptimization", "engine:orphaned-aws-resource", null, true)]
    [InlineData("CostOptimization", "orphan-candidate:aws-resource", null, true)]
    [InlineData("CostOptimization", "finding-type:OrphanedGcpResource", null, true)]
    [InlineData("CostOptimization", "engine:orphaned-gcp-resource", null, true)]
    [InlineData("CostOptimization", "orphan-candidate:gcp-resource", null, true)]
    [InlineData("CostOptimization", null, "Unattached managed disk detected", true)]
    [InlineData("CostOptimization", null, "Unattached EBS volume (no active attachment).", true)]
    [InlineData("CostOptimization", null, "Unattached persistent disk (no users).", true)]
    [InlineData("Security", "finding-type:OrphanedAzureResource", null, false)]
    [InlineData("CostOptimization", "other-evidence", "benign message", false)]
    public void OrphanCandidateFindingClassifier_classifies_structured_and_legacy_markers(
        string category,
        string? evidenceRef,
        string? message,
        bool expected)
    {
        ArchitectureFinding finding = new()
        {
            Category = category,
            Message = message ?? string.Empty,
        };

        if (!string.IsNullOrWhiteSpace(evidenceRef))
            finding.EvidenceRefs.Add(evidenceRef);

        OrphanCandidateFindingClassifier.IsOrphanCandidate(finding).Should().Be(expected);
    }

    [Fact]
    public void OrphanCandidateFindingClassifier_DistinctByFindingId_prefers_finding_id_and_dedupes_rows()
    {
        ArchitectureFinding first = new() { FindingId = "same-id", Category = "A", Message = "one" };
        ArchitectureFinding duplicate = new() { FindingId = "same-id", Category = "B", Message = "two" };
        ArchitectureFinding fallbackKey = new() { FindingId = "", Category = "Cost", Message = "orphan disk", EstimatedUsdSavings = 12m };

        List<ArchitectureFinding> distinct = OrphanCandidateFindingClassifier
            .DistinctByFindingId([first, duplicate, fallbackKey, fallbackKey])
            .ToList();

        distinct.Should().HaveCount(2);
        distinct[0].Should().BeSameAs(first);
        distinct[1].Should().BeSameAs(fallbackKey);
    }

    [Fact]
    public async Task CloudflareDnsTxtRecordLookup_returns_trimmed_txt_records_and_skips_non_txt_rows()
    {
        string payload = """
            {
              "Answer": [
                { "type": 16, "data": "\"v=spf1 include:example.com ~all\"" },
                { "type": 1, "data": "ignored-a-record" },
                { "type": 16, "data": "   " }
              ]
            }
            """;

        CloudflareDnsTxtRecordLookup sut = new(new HttpClient(new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/dns-json"),
            })));

        IReadOnlyList<string> records = await sut.GetTxtRecordsAsync("example.com", CancellationToken.None);

        records.Should().Equal("v=spf1 include:example.com ~all");
    }

    [Fact]
    public async Task CloudflareDnsTxtRecordLookup_returns_empty_when_answer_missing()
    {
        CloudflareDnsTxtRecordLookup sut = new(new HttpClient(new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new { Answer = Array.Empty<object>() }),
            })));

        IReadOnlyList<string> records = await sut.GetTxtRecordsAsync("example.com", CancellationToken.None);

        records.Should().BeEmpty();
    }

    [Fact]
    public async Task CloudflareDnsTxtRecordLookup_rejects_blank_domain()
    {
        CloudflareDnsTxtRecordLookup sut = new(new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK))));

        Func<Task> act = async () => await sut.GetTxtRecordsAsync("   ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            HttpResponseMessage response = responder(request);
            response.RequestMessage = request;

            return Task.FromResult(response);
        }
    }
}
