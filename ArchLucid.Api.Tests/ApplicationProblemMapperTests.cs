using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Application Problem Mapper.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ApplicationProblemMapperTests
{
    [SkippableFact]
    public void TryMapUnhandledException_ComparisonVerificationFailed_Returns422()
    {
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Summary = "x"
        };
        ComparisonVerificationFailedException ex = new("verify", drift);
        DefaultHttpContext http = CreateHttpContext("/p", "corr-verify");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(422);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.ComparisonVerificationFailed);
        p.Extensions[ProblemCorrelation.ExtensionKey].Should().Be("corr-verify");
    }

    [SkippableFact]
    public void TryMapUnhandledException_Conflict_Returns409()
    {
        ConflictException ex = new("c");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-409");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.Conflict);
        p.Extensions[ProblemCorrelation.ExtensionKey].Should().Be("corr-409");
    }

    [SkippableFact]
    public void TryMapUnhandledException_QualityGateRejected_Returns409_with_stable_extensions()
    {
        AgentOutputQualityGateRejectedException ex = new("run-1", "trace-1", "Topology");
        DefaultHttpContext http = CreateHttpContext("/v1/architecture/run/run-1/execute", "corr-qg");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.QualityGateRejected);
        p.Extensions["errorCode"].Should().Be(ProblemErrorCodes.QualityGateRejected);
        p.Extensions[ProblemDocumentationLinks.RunbookExtensionKey].Should().Be(
            ProblemDocumentationLinks.QualityGateRejectionRunbookRelativePath);
        p.Extensions["runId"].Should().Be("run-1");
        p.Extensions["traceId"].Should().Be("trace-1");
        p.Extensions["agentLabel"].Should().Be("Topology");
        p.Extensions.Should().ContainKey("supportHint");
        ((string)p.Extensions["supportHint"]!).Should().Contain("QUALITY_GATE_REJECTION");
    }

    [SkippableFact]
    public void TryMapUnhandledException_QualityGateRejected_includes_evaluationReason_when_present()
    {
        AgentOutputQualityGateRejectedException ex = new("run-1", "trace-1", "Topology", "missing_or_empty_citations");
        DefaultHttpContext http = CreateHttpContext("/v1/architecture/run/run-1/execute", "corr-qg2");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        MvcProblemDetails p = result!.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Extensions["evaluationReason"].Should().Be("missing_or_empty_citations");
    }

    [SkippableFact]
    public void TryMapUnhandledException_RunNotFound_Returns404()
    {
        RunNotFoundException ex = new("missing");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-404");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(404);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public void TryMapUnhandledException_LlmTokenQuotaExceeded_Returns429()
    {
        LlmTokenQuotaExceededException ex = new("quota");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-429");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(StatusCodes.Status429TooManyRequests);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.LlmTokenQuotaExceeded);
        p.Extensions.ContainsKey("retryAfterUtc").Should().BeFalse();
    }

    [SkippableFact]
    public void TryMapUnhandledException_LlmTokenQuotaExceeded_with_retry_includes_extension()
    {
        DateTimeOffset retry = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);
        LlmTokenQuotaExceededException ex = new("quota", retry);
        DefaultHttpContext http = CreateHttpContext("/p", "corr-429-retry");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        MvcProblemDetails p = result!.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Extensions["retryAfterUtc"].Should().Be(retry);
    }

    [SkippableFact]
    public void TryMapUnhandledException_InvalidOperation_Returns400()
    {
        InvalidOperationException ex = new("bad op");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-400");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(400);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.BadRequest);
    }

    [SkippableFact]
    public void TryMapUnhandledException_ArgumentException_Returns400Validation()
    {
        ArgumentException ex = new("arg");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-arg");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(400);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public void TryMapUnhandledException_ArgumentNullException_Returns400Validation()
    {
        ArgumentNullException ex = new("p");
        DefaultHttpContext http = CreateHttpContext("/p", "corr-null");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(400);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public void TryMapUnhandledException_UnmappedException_ReturnsFalse()
    {
        DefaultHttpContext http = CreateHttpContext("/p", "corr-none");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(
            new NotSupportedException(),
            http,
            out ObjectResult? result);

        mapped.Should().BeFalse();
        result.Should().BeNull();
    }

    [SkippableFact]
    public void TryMapUnhandledException_OperationCanceled_without_request_abort_maps_to_503()
    {
        OperationCanceledException ex = new();
        DefaultHttpContext http = CreateHttpContext("/v1/architecture/request", "corr-oce");

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeTrue();
        result!.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        MvcProblemDetails p = result.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        p.Type.Should().Be(ProblemTypes.DatabaseTimeout);
    }

    [SkippableFact]
    public void TryMapUnhandledException_OperationCanceled_when_request_aborted_is_unmapped()
    {
        OperationCanceledException ex = new();
        DefaultHttpContext http = CreateHttpContext("/v1/architecture/request", "corr-abort");
        CancellationTokenSource aborted = new();
        aborted.Cancel();
        http.RequestAborted = aborted.Token;

        bool mapped = ApplicationProblemMapper.TryMapUnhandledException(ex, http, out ObjectResult? result);

        mapped.Should().BeFalse();
        result.Should().BeNull();
    }

    private static DefaultHttpContext CreateHttpContext(string path, string traceIdentifier)
    {
        return new DefaultHttpContext { TraceIdentifier = traceIdentifier, Request = { Path = path } };
    }
}
