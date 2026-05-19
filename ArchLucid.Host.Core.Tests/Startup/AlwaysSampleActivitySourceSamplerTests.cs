using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Startup.Tracing;

using FluentAssertions;

using OpenTelemetry.Trace;

namespace ArchLucid.Host.Core.Tests.Startup;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AlwaysSampleActivitySourceSamplerTests
{
    private static readonly string[] AuthorityRunSourceList = [ArchLucidInstrumentation.AuthorityRun.Name];

    [Fact]
    public void ShouldSample_When_authority_stage_name_always_records()
    {
        AlwaysSampleActivitySourceSampler sampler = new(
            AuthorityRunSourceList,
            new AlwaysOffSampler());

        SamplingParameters parameters = CreateRootParameters("authority.context_ingestion");

        SamplingResult result = sampler.ShouldSample(in parameters);

        result.Decision.Should().Be(SamplingDecision.RecordAndSample);
    }

    [Fact]
    public void ShouldSample_When_http_style_name_delegates_to_fallback()
    {
        TraceIdRatioBasedSampler ratio = new(0.0);
        AlwaysSampleActivitySourceSampler sampler = new(AuthorityRunSourceList, ratio);

        SamplingParameters parameters = CreateRootParameters("GET /v1/health/live");

        SamplingResult result = sampler.ShouldSample(in parameters);

        result.Decision.Should().Be(SamplingDecision.Drop);
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
