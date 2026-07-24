using ArchLucid.Core.Manifest;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Validation.Rules;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch11Tests
{
    [Fact]
    public void SqlPasswordCredentialIssueMessages_maps_password_present()
    {
        string message = SqlPasswordCredentialIssueMessages.For(SqlPasswordCredentialIssueKind.PasswordPresent);

        message.Should().Contain("Password");
        message.Should().Contain("Managed Identity");
    }

    [Fact]
    public void SqlPasswordCredentialIssueMessages_maps_user_id_without_authentication()
    {
        string message = SqlPasswordCredentialIssueMessages.For(SqlPasswordCredentialIssueKind.UserIdWithoutAuthentication);

        message.Should().Contain("User ID");
        message.Should().Contain("Authentication=");
    }

    [Fact]
    public void SqlPasswordCredentialIssueMessages_throws_for_unknown_kind()
    {
        Action act = () => SqlPasswordCredentialIssueMessages.For((SqlPasswordCredentialIssueKind)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void AskRetrievalSqlFallback_includes_decision_lines_when_keywords_match()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = Guid.NewGuid() },
            GoldenManifest = new ManifestDocument
            {
                Decisions =
                [
                    new ResolvedArchitectureDecision
                    {
                        Title = "Data residency",
                        SelectedOption = "Keep data in primary region",
                    },
                ],
            },
        };

        string context = AskRetrievalSqlFallback.BuildFromRunDetail(detail, "data residency requirements");

        context.Should().Contain("Decision:");
        context.Should().Contain("Data residency");
    }

    [Fact]
    public void ArchLucidSerilogConfiguration_detects_empty_write_to_section()
    {
        IConfiguration config = new ConfigurationBuilder().Build();

        ArchLucidSerilogConfiguration.IsSerilogWriteToEmpty(config).Should().BeTrue();
    }

    [Fact]
    public void ArchLucidSerilogConfiguration_detects_configured_write_to_section()
    {
        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Serilog:WriteTo:0:Name"] = "Console" })
            .Build();

        ArchLucidSerilogConfiguration.IsSerilogWriteToEmpty(config).Should().BeFalse();
    }
}
