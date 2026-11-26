using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProvisionedDependencyIdentityBindingSourceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "python");
    private static VerifiedDependencyIdentityBinding Binding() => new(Request, "artifact", "identity", true,
        ["storage.read"], "verified-binding", Now.AddMinutes(-1), Now.AddMinutes(4));

    [Fact]
    public async Task Current_pinned_scope_bound_evidence_is_available()
    {
        var result = await Read([Binding()]);
        Assert.NotNull(result);
        Assert.Equal("identity", Assert.Single(result).IdentityId);
    }

    [Fact]
    public async Task Rejects_foreign_expired_modified_and_revoked_evidence()
    {
        Assert.Null(await Read([Binding() with { Scope = Request with { TenantId = Guid.NewGuid() } }]));
        Assert.Null(await Read([Binding() with { Scope = Request with { DeploymentGeneration = "other" } }]));
        Assert.Null(await Read([Binding() with { ValidUntil = Now }]));
        Assert.Null(await Read([Binding() with { ObservedAt = Now.AddMinutes(1) }]));
        Assert.Null(await Read([Binding() with { GrantedCapabilities = [""] }]));
        Assert.Null(await Read([Binding()], digestOverride: new string('0', 64)));
        Assert.Null(await Read([Binding()], gate: new Gate(false)));
        Assert.Null(await Read([Binding()], gate: new Gate(true, false)));
        Assert.Null(await Read([Binding()], requested: Request with { ProjectId = Guid.NewGuid() }));
    }

    private static Task<IReadOnlyList<VerifiedDependencyIdentityBinding>?> Read(
        VerifiedDependencyIdentityBinding[] bindings, string? digestOverride = null,
        Gate? gate = null, RuntimeObservationRequest? requested = null)
    {
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(bindings);
        string prefix = "SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(Request) + ":IdentityBindings";
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SecureNow:RuntimeTelemetry:Enabled"] = "true",
            [prefix + ":PayloadBase64"] = Convert.ToBase64String(bytes),
            [prefix + ":VerifiedSha256"] = digestOverride ?? Convert.ToHexString(SHA256.HashData(bytes)),
        }).Build();
        return new ProvisionedDependencyIdentityBindingSource(config, gate ?? new Gate(true), new Clock())
            .ReadAsync(requested ?? Request, CancellationToken.None);
    }
    private sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Gate(bool first, bool subsequent = true) : IRuntimeTelemetryReadAuthority
    {
        private int calls;
        public Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(calls++ == 0 ? first : subsequent);
    }
}
