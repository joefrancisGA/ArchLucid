using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Startup.Tracing;

using FluentAssertions;

using OpenTelemetry.Trace;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for <see cref="AlwaysSampleActivitySourceSampler" /> and <see cref="AlwaysSampleActivitySourceSpanMatcher" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AlwaysSampleActivitySourceSamplerTests
{
    private static readonly string[] AuthorityRunSourceList = [ArchLucidInstrumentation.AuthorityRun.Name];

    [SkippableFact]
    public void ShouldSample_When_authority_stage_name_always_records()
    {
        AlwaysSampleActivitySourceSampler sampler = new(
            AuthorityRunSourceList,
            new AlwaysOffSampler());

        SamplingParameters parameters = CreateRootParameters("authority.context_ingestion");

        SamplingResult result = sampler.ShouldSample(in parameters);

        result.Decision.Should().Be(SamplingDecision.RecordAndSample);
    }

    [SkippableFact]
    public void ShouldSample_When_authority_root_name_always_records()
    {
        AlwaysSampleActivitySourceSampler sampler = new(
            AuthorityRunSourceList,
            new AlwaysOffSampler());

        SamplingParameters parameters = CreateRootParameters(ArchLucidInstrumentation.AuthorityRunRootActivityName);

        SamplingResult result = sampler.ShouldSample(in parameters);

        result.Decision.Should().Be(SamplingDecision.RecordAndSample);
    }

    [SkippableFact]
    public void ShouldSample_When_http_style_name_delegates_to_fallback()
    {
        TraceIdRatioBasedSampler ratio = new(0.0);
        AlwaysSampleActivitySourceSampler sampler = new(AuthorityRunSourceList, ratio);

        SamplingParameters parameters = CreateRootParameters("GET /v1/health/live");

        SamplingResult result = sampler.ShouldSample(in parameters);

        result.Decision.Should().Be(SamplingDecision.Drop);
    }

    [SkippableTheory]
    [InlineData("authority.context_ingestion", true)]
    [InlineData("authority.run", true)]
    [InlineData("authority.run.test", true)]
    [InlineData("GET /v1/runs", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void SpanMatcher_Matches_authority_run_source_by_span_name(string? spanName, bool expected)
    {
        bool matches = AlwaysSampleActivitySourceSpanMatcher.Matches(
            ArchLucidInstrumentation.AuthorityRun.Name,
            spanName);

        matches.Should().Be(expected);
    }

    private static SamplingParameters CreateRootParameters(string name)
    {
        return new SamplingParameters(
            parentContext: default,
            traceId: ActivityTraceId.CreateRandom(),
            name: name,
            kind: ActivityKind.Internal);
    }
}
