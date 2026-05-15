using ArchLucid.Core.Authority;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

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
}
