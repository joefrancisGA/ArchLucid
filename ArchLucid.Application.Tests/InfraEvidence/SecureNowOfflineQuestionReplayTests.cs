using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowOfflineQuestionReplayTests
{
    private const string SubscriptionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string ResourceId =
        "/subscriptions/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/resourceGroups/rg/providers/Microsoft.Web/sites/app-one";

    [Fact]
    public void Offline_zip_replay_uses_production_question_compiler_for_isolated_resource()
    {
        byte[] package = CreateZip(
            $$"""
              [{"resourceId":"{{ResourceId}}","resourceType":"Microsoft.Web/sites","name":"app-one"}]
              """);

        SecureNowOfflineQuestionReplayResult replay = SecureNowOfflineQuestionReplay.Replay(package);
        replay.ResourceCount.Should().Be(1);
        replay.SubscriptionId.Should().Be(SubscriptionId);
        replay.PackageSha256.Should().HaveLength(64);
        replay.Questions.Should().ContainSingle();
        replay.Questions[0].QuestionKey.Should().Be("unknown-evidence@v1");
        replay.Questions[0].QuestionText.Should().Contain("app-one");
        replay.Questions[0].Status.ToString().Should().Be("Open");
    }

    [Fact]
    public void Shared_service_does_not_generate_a_spurious_isolated_resource_question()
    {
        byte[] package = CreateZip(
            $$"""
              [{"resourceId":"/subscriptions/{{SubscriptionId}}/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault-one",
                "resourceType":"Microsoft.KeyVault/vaults","name":"vault-one"}]
              """);

        SecureNowOfflineQuestionReplay.Replay(package).Questions.Should().BeEmpty();
    }

    [Fact]
    public void Existing_production_diagram_candidate_rule_respects_cited_relationship()
    {
        const string a = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";
        const string b = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord { SubscriptionId = "sub" },
            Resources =
            [
                new() { AzureResourceId = a, ResourceType = "Microsoft.Web/sites" },
                new() { AzureResourceId = b, ResourceType = "Microsoft.Storage/storageAccounts" },
            ],
            Relationships =
            [
                new() {
                    FromAzureResourceId = a, ToAzureResourceId = b,
                    RelationshipType = "CONNECTS_TO",
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };

        SecureNowDiagramQuestionCandidateBuilder.Build(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void Full_replay_from_same_bytes_produces_stable_fingerprints()
    {
        byte[] package = CreateZip(
            $$"""
              [{"resourceId":"{{ResourceId}}","resourceType":"Microsoft.Web/sites"}]
              """);
        SecureNowOfflineQuestionReplayResult first = SecureNowOfflineQuestionReplay.Replay(package);
        SecureNowOfflineQuestionReplayResult second = SecureNowOfflineQuestionReplay.Replay(package);
        first.PackageSha256.Should().Be(second.PackageSha256);
        first.Questions.Select(q => q.EvidenceFingerprint)
            .Should().Equal(second.Questions.Select(q => q.EvidenceFingerprint));
    }

    [Fact]
    public void Rejects_invalid_zip_and_unsupported_schema()
    {
        Action malformed = () => SecureNowOfflineQuestionReplay.Replay("not-a-zip"u8.ToArray());
        malformed.Should().Throw<InvalidDataException>();

        byte[] package = CreateZip("[]", schemaVersion: 99);
        Action unsupported = () => SecureNowOfflineQuestionReplay.Replay(package);
        unsupported.Should().Throw<InvalidDataException>();
    }

    private static byte[] CreateZip(string resources, int schemaVersion = 2)
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(archive, "manifest.json",
                $$"""
                  {"schemaVersion":{{schemaVersion}},"scriptVersion":"offline-test",
                   "collectionTimestamp":"2026-11-01T00:00:00Z",
                   "subscriptionId":"{{SubscriptionId}}",
                   "scope":"/subscriptions/{{SubscriptionId}}",
                   "switchesUsed":[],"azModuleVersion":"test"}
                  """);
            Write(archive, "resources.json", resources);
        }
        return stream.ToArray();
    }

    private static void Write(ZipArchive archive, string entryName, string content)
    {
        using StreamWriter writer = new(
            archive.CreateEntry(entryName).Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}
