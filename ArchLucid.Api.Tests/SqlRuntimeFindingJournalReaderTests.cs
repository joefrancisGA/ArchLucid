using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlRuntimeFindingJournalReaderTests
{
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "php");
    private static readonly DateTime Recorded = new(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc);

    private static RuntimeCatalogAssessment Assessment() => new(true,
        [new(Request, "CVE-fixture", "vendor-proof", "catalog-proof", "runtime-proof", 1, true)], 0);

    [Fact]
    public void Exact_historical_evidence_round_trips()
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(Assessment());
        var hash = SHA256.HashData(bytes);
        var entry = SqlRuntimeFindingJournalReader.Validate(Request, Recorded, hash, bytes);
        Assert.NotNull(entry);
        Assert.Equal(Recorded, entry.RecordedUtc);
        Assert.Equal(Convert.ToHexString(hash), entry.PayloadHash);
        Assert.Equal("CVE-fixture", Assert.Single(entry.Assessment.Findings).AdvisoryId);
    }

    [Fact]
    public void Rejects_tampering_foreign_scope_and_unavailable_catalog()
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(Assessment());
        var hash = SHA256.HashData(bytes);
        Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request with { ProjectId = Guid.NewGuid() }, Recorded, hash, bytes));
        Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request with { DeploymentGeneration = "other" }, Recorded, hash, bytes));
        Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request, Recorded, new byte[32], bytes));
        bytes[0] ^= 1;
        Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request, Recorded, hash, bytes));
        var unavailable = JsonSerializer.SerializeToUtf8Bytes(Assessment() with { CatalogCurrent = false });
        Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request, Recorded, SHA256.HashData(unavailable), unavailable));
    }

    [Fact]
    public void Rejects_empty_oversized_and_malformed_payloads()
    {
        foreach (byte[] bytes in new[] { Array.Empty<byte>(), new byte[1048577], "{"u8.ToArray(),
            JsonSerializer.SerializeToUtf8Bytes(new RuntimeCatalogAssessment(true, [], 0)) })
            Assert.Null(SqlRuntimeFindingJournalReader.Validate(Request, Recorded, SHA256.HashData(bytes), bytes));
    }
}
