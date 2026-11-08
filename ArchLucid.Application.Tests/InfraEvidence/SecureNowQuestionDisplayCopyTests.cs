using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Application")]
public sealed class SecureNowQuestionDisplayCopyTests
{
    [Fact]
    public void Inferred_connection_without_resource_name_does_not_imply_stored_name()
    {
        SecureNowQuestionRecord question = new()
        {
            Source = SecureNowQuestionSource.InferredConnection,
            QuestionText = string.Empty,
            ResourceId = string.Empty,
        };

        SecureNowQuestionRecord result = SecureNowQuestionDisplayCopy.WithResourceIdentity(
            question,
            string.Empty,
            string.Empty);

        result.QuestionText.Should().Be(
            "Should SecureNow record this inferred connection without a stored resource name?");
    }

    [Fact]
    public void Orphan_still_needed_uses_resource_id_tail_without_lowercased_display_name()
    {
        SecureNowQuestionRecord question = new()
        {
            QuestionKey = "orphan-still-needed@v1",
            QuestionText = string.Empty,
            ResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/StorageAccount",
        };

        SecureNowQuestionRecord result = SecureNowQuestionDisplayCopy.WithResourceIdentity(
            question,
            "Microsoft.Storage/storageAccounts",
            question.ResourceId);

        result.QuestionText.Should().Be(
            "Resource id ends with StorageAccount. A separate display name was not stored. Is this resource still needed?");
        result.QuestionText.Should().NotContain("storageaccount");
        result.ResourceName.Should().Be("StorageAccount");
    }

    [Fact]
    public void Unknown_evidence_without_resource_name_asks_peer_or_stand_alone()
    {
        SecureNowQuestionRecord question = new()
        {
            QuestionKey = "unknown-evidence@v1",
            QuestionText = string.Empty,
            ResourceId = string.Empty,
        };

        SecureNowQuestionRecord result = SecureNowQuestionDisplayCopy.WithResourceIdentity(
            question,
            string.Empty,
            string.Empty);

        result.QuestionText.Should().Be(
            "Resource name was not stored. Should this resource connect to a peer, or stand alone?");
    }
}
