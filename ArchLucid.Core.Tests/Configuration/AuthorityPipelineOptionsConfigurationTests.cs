using ArchLucid.Core.Authority;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

/// <summary>Configuration binding for <see cref="AuthorityPipelineOptions"/> under <c>ArchLucid:AuthorityPipeline:</c>.</summary>
public sealed class AuthorityPipelineOptionsConfigurationTests
{
    private const string AuthorityPipelineOrchestratorBackendKey =
        "ArchLucid:AuthorityPipeline:OrchestratorBackend";

    [Fact]
    public void AuthorityPipeline_OrchestratorBackend_defaults_to_Legacy()
    {
        AuthorityPipelineOptions options = new();

        options.OrchestratorBackend.Should().Be(OrchestratorBackend.Legacy);
    }

    [Fact]
    public void AuthorityPipeline_OrchestratorBackend_round_trips_enum_values_via_IConfiguration_binding()
    {
        foreach (OrchestratorBackend expected in Enum.GetValues<OrchestratorBackend>())
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        [AuthorityPipelineOrchestratorBackendKey] = expected.ToString(),
                    })
                .Build();

            AuthorityPipelineOptions options = new();
            configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName).Bind(options);

            options.OrchestratorBackend.Should().Be(expected);
        }
    }

    [Fact]
    public void AuthorityPipeline_Concurrency_binds_under_nested_ArchLucid_section()
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:AuthorityPipeline:Concurrency:MaxConcurrentExecutionsPerTenant"] = "5",
                    ["ArchLucid:AuthorityPipeline:Concurrency:RejectInlineCreateWhenConcurrencyUnavailable"] = "true",
                    ["ArchLucid:AuthorityPipeline:Concurrency:LeaseRecognitionHorizon"] = "02:30:00",
                    ["ArchLucid:AuthorityPipeline:Concurrency:WaitPollMilliseconds"] = "120",

                })
            .Build();

        AuthorityPipelineOptions options = new();

        configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName).Bind(options);

        options.Concurrency.MaxConcurrentExecutionsPerTenant.Should().Be(5);

        options.Concurrency.RejectInlineCreateWhenConcurrencyUnavailable.Should().BeTrue();

        options.Concurrency.LeaseRecognitionHorizon.Should().Be(TimeSpan.FromHours(2.5));

        options.Concurrency.WaitPollMilliseconds.Should().Be(120);
    }

    [Fact]
    public void AuthorityPipeline_Concurrency_clamps_negative_lease_recognition_horizon_to_zero()
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:AuthorityPipeline:Concurrency:LeaseRecognitionHorizon"] = "-01:00:00",
                })
            .Build();

        AuthorityPipelineOptions options = new();

        configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName).Bind(options);

        options.Concurrency.LeaseRecognitionHorizon.Should().Be(
            TimeSpan.Zero,
            "negative horizons must not push lease stale cutoffs into the future for SQL capacity accounting");
    }

    [Fact]
    public void AuthorityPipeline_Concurrency_negative_wait_poll_milliseconds_binds_for_sql_gate_clamp()
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:AuthorityPipeline:Concurrency:WaitPollMilliseconds"] = "-5",
                })
            .Build();

        AuthorityPipelineOptions options = new();
        configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName).Bind(options);

        options.Concurrency.WaitPollMilliseconds.Should().Be(-5);
    }

    [Fact]
    public void AuthorityPipeline_negative_pipeline_timeout_binds_without_throwing()
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:AuthorityPipeline:PipelineTimeout"] = "-00:01:00",
                })
            .Build();

        AuthorityPipelineOptions options = new();
        configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName).Bind(options);

        options.PipelineTimeout.Should().BeNegative();
    }
}
