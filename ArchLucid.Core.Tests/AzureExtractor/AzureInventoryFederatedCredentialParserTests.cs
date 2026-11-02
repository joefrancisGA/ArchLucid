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

    [Fact]
    public void TryParse_reads_parent_resource_id_when_parentResourceId_is_percent_encoded_plain_arm_scalar()
    {
        const string parentId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uai1";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "issuer": "https://token.actions.githubusercontent.com",
                                                              "subject": "repo:org/repo:environment:prod",
                                                              "principalId": "11111111-1111-1111-1111-111111111111",
                                                              "parentResourceId": "{{Uri.EscapeDataString(parentId)}}",
                                                              "provenanceKind": "ObservedFact"
                                                            }
                                                            """);

        bool parsed = AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(parentId));
    }

    [Fact]
    public void TryParse_reads_issuer_when_issuer_is_percent_encoded_https_url()
    {
        const string issuer = "https://token.actions.githubusercontent.com";
        string encodedIssuer = Uri.EscapeDataString(issuer);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "issuer": "{{encodedIssuer}}",
                                                              "subject": "repo:org/repo:environment:prod",
                                                              "principalId": "11111111-1111-1111-1111-111111111111",
                                                              "provenanceKind": "ObservedFact"
                                                            }
                                                            """);

        bool parsed = AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.Issuer.Should().Be(issuer);
    }

    [Fact]
    public void TryParse_default_evidence_hash_matches_when_issuer_is_percent_encoded_https_url()
    {
        const string issuer = "https://token.actions.githubusercontent.com";
        const string subject = "repo:org/repo:environment:prod";
        const string principalId = "11111111-1111-1111-1111-111111111111";
        byte[] expectedHash = AzureInventoryFederatedCredentialParser.ComputeDefaultEvidenceHash(
            issuer,
            subject,
            principalId,
            appId: null);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "issuer": "{{Uri.EscapeDataString(issuer)}}",
                                                              "subject": "{{subject}}",
                                                              "principalId": "{{principalId}}",
                                                              "provenanceKind": "ObservedFact"
                                                            }
                                                            """);

        AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error).Should().BeTrue(error);

        row!.EvidenceHashSha256.Should().Equal(expectedHash);
    }

    [Fact]
    public void TryParse_decodes_double_encoded_issuer_before_computing_default_evidence_hash()
    {
        const string issuer = "https://token.actions.githubusercontent.com";
        const string subject = "repo:org/repo:environment:prod";
        const string principalId = "11111111-1111-1111-1111-111111111111";
        byte[] expectedHash = AzureInventoryFederatedCredentialParser.ComputeDefaultEvidenceHash(
            issuer,
            subject,
            principalId,
            appId: null);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "issuer": "{{Uri.EscapeDataString(Uri.EscapeDataString(issuer))}}",
                                                              "subject": "{{subject}}",
                                                              "principalId": "{{principalId}}",
                                                              "provenanceKind": "ObservedFact"
                                                            }
                                                            """);

        AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error).Should().BeTrue(error);

        row!.Issuer.Should().Be(issuer);
        row.EvidenceHashSha256.Should().Equal(expectedHash);
    }

    [Theory]
    [InlineData("issuer%")]
    [InlineData("issuer%ZZ")]
    public void TryParse_does_not_throw_for_malformed_percent_encoded_issuer(string issuer)
    {
        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "issuer": "{{issuer}}",
                                                              "subject": "repo:org/repo:environment:prod",
                                                              "principalId": "11111111-1111-1111-1111-111111111111",
                                                              "provenanceKind": "ObservedFact"
                                                            }
                                                            """);

        AzureInventoryFederatedCredentialParser.TryParse(
            document.RootElement,
            out AzureInventoryFederatedCredentialRow? row,
            out string? error).Should().BeTrue(error);

        row!.Issuer.Should().Be(issuer);
    }
}
