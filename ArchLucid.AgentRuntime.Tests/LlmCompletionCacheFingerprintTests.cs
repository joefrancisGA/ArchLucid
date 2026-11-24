using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class LlmCompletionCacheFingerprintTests
{
    [Fact]
    public void EnabledSharedCache_RequiresScopePartitioning()
    {
        LlmCompletionResponseCacheOptions safe = new() { PartitionByScope = true };
        Action permitted = safe.RequireScopePartitioning;
        permitted.Should().NotThrow();

        LlmCompletionResponseCacheOptions unsafeOptions = new() { PartitionByScope = false };
        Action rejected = unsafeOptions.RequireScopePartitioning;
        rejected.Should().Throw<InvalidOperationException>();
    }

    [SkippableFact]
    public void Compute_when_partitionByScope_differs_by_tenant_produces_different_keys()
    {
        ScopeContext scopeA = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };

        ScopeContext scopeB = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = scopeA.WorkspaceId,
            ProjectId = scopeA.ProjectId
        };

        string keyA = LlmCompletionCacheFingerprint.Compute(true, "dep", "sys", "user", scopeA);
        string keyB = LlmCompletionCacheFingerprint.Compute(true, "dep", "sys", "user", scopeB);

        keyA.Should().NotBe(keyB);
    }

    [SkippableFact]
    public void Compute_when_partitionByScope_false_ignores_scope_ids()
    {
        ScopeContext scopeA = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        string keyA = LlmCompletionCacheFingerprint.Compute(false, "dep", "sys", "user", scopeA);
        string keyB = LlmCompletionCacheFingerprint.Compute(false, "dep", "sys", "user", scopeB);

        keyA.Should().Be(keyB);
    }

    [SkippableFact]
    public void Compute_throws_when_deployment_name_null_or_whitespace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        Action empty = () => LlmCompletionCacheFingerprint.Compute(false, "", "s", "u", scope);
        Action whitespace = () => LlmCompletionCacheFingerprint.Compute(false, "   ", "s", "u", scope);

        empty.Should().Throw<ArgumentException>().WithParameterName("deploymentName");
        whitespace.Should().Throw<ArgumentException>().WithParameterName("deploymentName");
    }

    [SkippableFact]
    public void Compute_throws_when_system_prompt_null()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        Action act = () => LlmCompletionCacheFingerprint.Compute(false, "dep", null!, "u", scope);

        act.Should().Throw<ArgumentNullException>().WithParameterName("systemPrompt");
    }

    [SkippableFact]
    public void Compute_throws_when_user_prompt_null()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        Action act = () => LlmCompletionCacheFingerprint.Compute(false, "dep", "s", null!, scope);

        act.Should().Throw<ArgumentNullException>().WithParameterName("userPrompt");
    }

    [SkippableFact]
    public void Compute_throws_when_scope_null()
    {
        Action act = () => LlmCompletionCacheFingerprint.Compute(false, "dep", "s", "u", null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("scope");
    }

    [SkippableFact]
    public void ComputePromptHash_returns_stable_hex_digest()
    {
        string digest = LlmCompletionCacheFingerprint.ComputePromptHash("a", "b");
        digest.Should().HaveLength(64);
        LlmCompletionCacheFingerprint.ComputePromptHash("a", "b").Should().Be(digest);
    }

    [Fact]
    public void ComputePromptHash_distinguishes_embedded_delimiters()
    {
        LlmCompletionCacheFingerprint.ComputePromptHash("a\0b", "c")
            .Should().NotBe(LlmCompletionCacheFingerprint.ComputePromptHash("a", "b\0c"));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Compute_distinguishes_embedded_delimiters(bool partitionByScope)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        LlmCompletionCacheFingerprint.Compute(partitionByScope, "dep", "a\0b", "c", scope)
            .Should().NotBe(LlmCompletionCacheFingerprint.Compute(partitionByScope, "dep", "a", "b\0c", scope));
    }

    [Fact]
    public void ComputePromptHash_does_not_reuse_legacy_digest()
    {
        string legacy = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes("a\0b")));

        LlmCompletionCacheFingerprint.ComputePromptHash("a", "b").Should().NotBe(legacy);
    }
}
