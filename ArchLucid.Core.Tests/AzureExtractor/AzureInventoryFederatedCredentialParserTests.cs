using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryFederatedCredentialParserTests
{
    [Fact]
    public void TryParse_valid_observed_fact_row_maps_fields()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "issuer": "https://token.actions.githubusercontent.com",
              "subject": "repo:org/repo:environment:prod",
              "principalId": "11111111-1111-1111-1111-111111111111",
              "appId": "22222222-2222-2222-2222-222222222222",
              "provenanceKind": "ObservedFact"
            }
            """);

        bool parsed = AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        row.Should().NotBeNull();
        row!.Issuer.Should().Be("https://token.actions.githubusercontent.com");
        row.Subject.Should().Be("repo:org/repo:environment:prod");
        row.PrincipalId.Should().Be("11111111-1111-1111-1111-111111111111");
        row.ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        row.EvidenceHashSha256.Should().NotBeNull();
    }

    [Fact]
    public void TryParse_missing_subject_is_rejected()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "issuer": "https://token.actions.githubusercontent.com",
              "principalId": "11111111-1111-1111-1111-111111111111"
            }
            """);

        bool parsed = AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out _,
            out string? error);

        parsed.Should().BeFalse();
        error.Should().Contain("subject");
    }
}
