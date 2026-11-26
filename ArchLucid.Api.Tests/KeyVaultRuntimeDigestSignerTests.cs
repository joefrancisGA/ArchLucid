using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Azure.Core;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class KeyVaultRuntimeDigestSignerTests
{
    private const string KeyUri = "https://testvault.vault.azure.net/keys/runtime/0123456789abcdef0123456789abcdef";
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "php");

    [Theory]
    [InlineData("http://testvault.vault.azure.net/keys/runtime/0123456789abcdef0123456789abcdef")]
    [InlineData("https://testvault.vault.azure.net.evil.example/keys/runtime/0123456789abcdef0123456789abcdef")]
    [InlineData("https://testvault.vault.azure.net/keys/runtime")]
    [InlineData("https://testvault.vault.azure.net:444/keys/runtime/0123456789abcdef0123456789abcdef")]
    [InlineData("https://testvault.vault.azure.net/keys/runtime/0123456789abcdef0123456789abcdef?x=1")]
    public void Rejects_unpinned_or_untrusted_key_uri(string uri) =>
        Assert.False(KeyVaultRuntimeDigestSigner.TryKeyUri(uri, out _));

    [Fact]
    public async Task Valid_signature_is_verified_against_independent_key()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var digest = SHA256.HashData("test"u8);
        var signature = key.SignHash(digest, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
        using var handler = new Handler(JsonSerializer.Serialize(new { kid = KeyUri, value = Encode(signature) }));
        using var client = new HttpClient(handler);
        var result = await Create(client, key, new Authority(true)).SignSha256Async(Request, digest, default);
        Assert.NotNull(result);
        Assert.Equal("key-1", result.Value.KeyId);
        Assert.Equal(signature, result.Value.Signature);
        Assert.Equal(1, handler.Calls);
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("{}")]
    [InlineData("{\"kid\":\"x\",\"kid\":\"y\",\"value\":\"z\"}")]
    public async Task Malformed_response_is_denied(string response)
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        using var handler = new Handler(response);
        using var client = new HttpClient(handler);
        Assert.Null(await Create(client, key, new Authority(true)).SignSha256Async(Request, new byte[32], default));
    }

    [Fact]
    public async Task Invalid_signature_and_revoked_authorization_are_denied()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        using var handler = new Handler(JsonSerializer.Serialize(new { kid = KeyUri, value = Encode(new byte[64]) }));
        using var client = new HttpClient(handler);
        Assert.Null(await Create(client, key, new Authority(true)).SignSha256Async(Request, new byte[32], default));
        Assert.Null(await Create(client, key, new Authority(false)).SignSha256Async(Request, new byte[32], default));
        Assert.Equal(1, handler.Calls);
        var signature = key.SignHash(new byte[32], DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
        using var validHandler = new Handler(JsonSerializer.Serialize(new { kid = KeyUri, value = Encode(signature) }));
        using var validClient = new HttpClient(validHandler);
        Assert.Null(await Create(validClient, key, new Authority(true, false)).SignSha256Async(Request, new byte[32], default));
    }

    private static KeyVaultRuntimeDigestSigner Create(HttpClient client, ECDsa key, Authority authority)
    {
        string prefix = "SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(Request);
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [prefix + ":Publication:KeyId"] = "key-1",
            [prefix + ":Publication:KeyVaultKeyUri"] = KeyUri,
        }).Build();
        return new(config, new Credential(), client, authority, new Trust(key.ExportSubjectPublicKeyInfo()));
    }
    private static string Encode(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private sealed class Credential : TokenCredential
    {
        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            new("test-token", DateTimeOffset.UtcNow.AddHours(1));
        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            ValueTask.FromResult(GetToken(requestContext, cancellationToken));
    }
    private sealed class Handler(string response) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(response) });
        }
    }
    private sealed class Authority(bool initial, bool subsequent = true) : IRuntimeAttestationPublicationAuthority
    {
        private int calls;
        public Task<bool> CanPublishAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(calls++ == 0 ? initial : subsequent);
    }
    private sealed class Trust(byte[] key) : IRuntimeTelemetryTrustRegistry
    {
        public Task<byte[]?> ReadCurrentKeyAsync(RuntimeObservationRequest request, string keyId, CancellationToken ct) =>
            Task.FromResult<byte[]?>(key.ToArray());
    }
}
