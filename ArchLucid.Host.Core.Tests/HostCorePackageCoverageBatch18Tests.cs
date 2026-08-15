using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch18Tests
{
    [Fact]
    public void ArchLucidJobNames_exposes_canonical_job_slugs()
    {
        ArchLucidJobNames.AdvisoryScan.Should().Be("advisory-scan");
        ArchLucidJobNames.OrphanProbe.Should().Be("orphan-probe");
        ArchLucidJobNames.DataArchival.Should().Be("data-archival");
        ArchLucidJobNames.FirstTenantFunnelArchival.Should().Be("first-tenant-funnel-archival");
        ArchLucidJobNames.TrialLifecycle.Should().Be("trial-lifecycle");
        ArchLucidJobNames.TrialEmailScan.Should().Be("trial-email-scan");
        ArchLucidJobNames.ExecDigestWeekly.Should().Be("exec-digest-weekly");
        ArchLucidJobNames.WeeklyExecutiveSummary.Should().Be("weekly-sponsor-summary");
        ArchLucidJobNames.WeeklyArchitectureDigest.Should().Be("weekly-architecture-digest");
        ArchLucidJobNames.AuditChangeFeed.Should().Be("audit-change-feed");
        ArchLucidJobNames.ServiceBusIntegrationEvents.Should().Be("servicebus-integration-events");
        ArchLucidJobNames.AuditRetryDrain.Should().Be("audit-retry-drain");
    }

    [Theory]
    [InlineData(ArchLucidJobExitCodes.Success, 0)]
    [InlineData(ArchLucidJobExitCodes.JobFailure, 1)]
    [InlineData(ArchLucidJobExitCodes.ConfigurationError, 2)]
    [InlineData(ArchLucidJobExitCodes.UnknownJob, 3)]
    public void ArchLucidJobExitCodes_exposes_stable_process_codes(int actual, int expected)
    {
        actual.Should().Be(expected);
    }

    [Fact]
    public void ArchLucidJobsOffload_detects_offloaded_jobs_from_configuration()
    {
        Dictionary<string, string?> config = new()
        {
            ["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.AuditRetryDrain,
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(config!).Build();

        ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.AuditRetryDrain).Should().BeTrue();
        ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.OrphanProbe).Should().BeFalse();
        ArchLucidJobsOffload.IsOffloaded(configuration, "   ").Should().BeFalse();
    }

    [Theory]
    [InlineData("corr-123", true)]
    [InlineData("bad;token", false)]
    [InlineData(null, false)]
    public void CorrelationIdHeaderParser_TryParse_validates_outbound_tokens(string? value, bool expected)
    {
        bool ok = CorrelationIdHeaderParser.TryParse(value, out string? parsed);

        ok.Should().Be(expected);

        if (expected)
            parsed.Should().Be(value!.Trim());
        else
            parsed.Should().BeNull();
    }

    [Fact]
    public void CorrelationIdHeaderParser_TryGetValidIncomingCorrelationId_rejects_blank_header_values()
    {
        DefaultHttpContext context = new();
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "   ";

        bool ok = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(
            context.Request.Headers,
            out string? correlationId);

        ok.Should().BeFalse();
        correlationId.Should().BeNull();
    }
}
