using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProvisionedRuntimeAdvisoryCatalogSourceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "php");

    [Fact]
    public async Task Accepts_only_authorized_pinned_current_catalog_and_derives_provenance()
    {
        var catalog = Catalog();
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(catalog);
        string digest = Convert.ToHexString(SHA256.HashData(bytes));
        var source = new ProvisionedRuntimeAdvisoryCatalogSource(Config(bytes, digest), new Authority(true), new Clock());
        var result = await source.ReadAsync(Request, default);
        Assert.NotNull(result);
        Assert.Equal("runtime-catalog:sha256:" + digest, result.EvidenceId);
        Assert.Single(result.Entries);
        Assert.Null(await source.ReadAsync(Request with { ProjectId = Guid.NewGuid() }, default));
        Assert.Null(await new ProvisionedRuntimeAdvisoryCatalogSource(Config(bytes, digest),
            new Authority(false), new Clock()).ReadAsync(Request, default));
    }

    [Fact]
    public async Task Rejects_tampering_expiration_and_revocation()
    {
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(Catalog());
        string digest = Convert.ToHexString(SHA256.HashData(bytes));
        byte[] modified = JsonSerializer.SerializeToUtf8Bytes(Catalog() with { EvidenceId = "modified" });
        Assert.Null(await new ProvisionedRuntimeAdvisoryCatalogSource(Config(modified, digest),
            new Authority(true), new Clock()).ReadAsync(Request, default));
        byte[] expired = JsonSerializer.SerializeToUtf8Bytes(Catalog() with { ValidUntil = Now });
        Assert.Null(await new ProvisionedRuntimeAdvisoryCatalogSource(Config(expired,
            Convert.ToHexString(SHA256.HashData(expired))), new Authority(true), new Clock()).ReadAsync(Request, default));
        Assert.Null(await new ProvisionedRuntimeAdvisoryCatalogSource(Config(bytes, digest),
            new Authority(true, false), new Clock()).ReadAsync(Request, default));
    }

    private static VerifiedRuntimeAdvisoryCatalog Catalog() => new("embedded", Now.AddHours(-1), Now.AddHours(1),
        [new("test-advisory", "php", "php", "upstream", "8.4.0", "8.4.10", "vendor-proof",
            Now.AddHours(-2), Now.AddHours(1), [])]);

    private static IConfiguration Config(byte[] payload, string digest)
    {
        string prefix = "SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(Request) + ":AdvisoryCatalog";
        return new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SecureNow:RuntimeTelemetry:Enabled"] = "true",
            [prefix + ":PayloadBase64"] = Convert.ToBase64String(payload),
            [prefix + ":VerifiedSha256"] = digest,
        }).Build();
    }
    private sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Authority(bool first, bool subsequent = true) : IRuntimeTelemetryReadAuthority
    {
        private int calls;
        public Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(calls++ == 0 ? first : subsequent);
    }
}
