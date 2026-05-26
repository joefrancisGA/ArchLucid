using System.Net;

using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Polly;

namespace ArchLucid.Host.Core.Tests.Http;

[Trait("Category", "Unit")]
public sealed class OidcAuthorityMetadataProbeHttpResilienceTests
{
    [Fact]
    public async Task BuildPipeline_retries_transient_http_status_before_succeeding()
    {
        int sendCount = 0;

        ResiliencePipeline<HttpResponseMessage> pipeline = OidcAuthorityMetadataProbeHttpResilience.BuildPipeline(
            static _ => TimeSpan.Zero);

        HttpResponseMessage response = await pipeline.ExecuteAsync(
            async _ =>
            {
                sendCount++;

                if (sendCount < 3)
                    return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);

                return new HttpResponseMessage(HttpStatusCode.OK);
            },
            CancellationToken.None);

        using (response)
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        sendCount.Should().Be(3);
    }

    [Theory]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.RequestTimeout)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    public void ShouldRetryResponse_returns_true_for_transient_status_codes(HttpStatusCode statusCode)
    {
        using HttpResponseMessage response = new(statusCode);

        OidcAuthorityMetadataProbeHttpResilience.ShouldRetryResponse(response).Should().BeTrue();
    }

    [Fact]
    public void ShouldRetryResponse_returns_false_for_success_status_codes()
    {
        using HttpResponseMessage response = new(HttpStatusCode.OK);

        OidcAuthorityMetadataProbeHttpResilience.ShouldRetryResponse(response).Should().BeFalse();
    }
}
