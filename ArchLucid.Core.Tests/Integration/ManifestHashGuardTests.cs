using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ManifestHashGuardTests
{
    [Fact]
    public void EnsureRunLinkedDigestManifestHashOrThrow_accepts_PascalCase_ManifestHash()
    {
        ArchitectureDigest digest = new()
        {
            DigestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            MetadataJson = """{"ManifestHash":"deadbeef"}""",
        };

        Action act = () => DigestDeliveryManifestHashGuard.EnsureRunLinkedDigestManifestHashOrThrow(digest);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureRunLinkedDigestManifestHashOrThrow_accepts_manifestHashSha256_metadata_alias()
    {
        ArchitectureDigest digest = new()
        {
            DigestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            MetadataJson = """{"manifestHashSha256":"deadbeef"}""",
        };

        Action act = () => DigestDeliveryManifestHashGuard.EnsureRunLinkedDigestManifestHashOrThrow(digest);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureRunScopedPayloadIncludesManifestHashOrThrow_accepts_PascalCase_ManifestHash()
    {
        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    runId = "22222222-2222-2222-2222-222222222222",
                    ManifestHash = "deadbeef",
                }));

        Action act = () => IntegrationEventOutboxManifestHashGuard.EnsureRunScopedPayloadIncludesManifestHashOrThrow(
            IntegrationEventTypes.AuthorityRunCompletedV1,
            payload);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureRunScopedPayloadIncludesManifestHashOrThrow_accepts_PascalCase_ManifestHashSha256()
    {
        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    runId = "22222222-2222-2222-2222-222222222222",
                    ManifestHashSha256 = "deadbeef",
                }));

        Action act = () => IntegrationEventOutboxManifestHashGuard.EnsureRunScopedPayloadIncludesManifestHashOrThrow(
            IntegrationEventTypes.AuthorityRunCompletedV1,
            payload);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureRunScopedPayloadIncludesManifestHashOrThrow_blocks_uppercase_event_type_without_manifest_hash()
    {
        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    runId = "22222222-2222-2222-2222-222222222222",
                }));

        Action act = () => IntegrationEventOutboxManifestHashGuard.EnsureRunScopedPayloadIncludesManifestHashOrThrow(
            IntegrationEventTypes.AuthorityRunCompletedV1.ToUpperInvariant(),
            payload);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*manifestHash is required*");
    }

    [Fact]
    public void EnsureRunScopedPayloadIncludesManifestHashOrThrow_accepts_uppercase_event_type_with_manifest_hash()
    {
        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    runId = "22222222-2222-2222-2222-222222222222",
                    manifestHash = "deadbeef",
                }));

        Action act = () => IntegrationEventOutboxManifestHashGuard.EnsureRunScopedPayloadIncludesManifestHashOrThrow(
            IntegrationEventTypes.AuthorityRunCompletedV1.ToUpperInvariant(),
            payload);

        act.Should().NotThrow();
    }
}
