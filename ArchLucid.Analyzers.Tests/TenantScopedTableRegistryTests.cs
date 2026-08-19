namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class TenantScopedTableRegistryTests
{
    private const string MinimalRegistryJson = """
        {
          "scopeTripleOnRow": ["dbo.Runs", "dbo.PolicyPacks"],
          "tenantIdOnRow": ["dbo.TenantSettings"]
        }
        """;

    [Theory]
    [InlineData("Runs", "dbo.Runs")]
    [InlineData("dbo.Runs", "dbo.Runs")]
    public void NormalizeTableName_accepts_common_forms(string raw, string expected)
    {
        string? normalized = TenantScopedTableRegistry.NormalizeTableName(raw);

        Assert.Equal(expected, normalized);
    }

    [Fact]
    public void NormalizeTableName_bracketed_two_part_name_is_not_supported()
    {
        Assert.Null(TenantScopedTableRegistry.NormalizeTableName("[dbo].[Runs]"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-table")]
    public void NormalizeTableName_returns_null_for_invalid_input(string raw)
    {
        Assert.Null(TenantScopedTableRegistry.NormalizeTableName(raw));
    }

    [Fact]
    public void LoadFromAdditionalFile_builds_scope_sets_from_json()
    {
        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile(MinimalRegistryJson);

        Assert.True(registry.IsTenantScoped("dbo.Runs"));
        Assert.True(registry.RequiresTripleScope("dbo.Runs"));
        Assert.True(registry.RequiresTenantIdScope("dbo.TenantSettings"));
        Assert.False(registry.IsTenantScoped("dbo.UnknownTable"));
    }

    [Fact]
    public void LoadFromAdditionalFile_returns_empty_for_missing_arrays()
    {
        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile("{}");

        Assert.Same(TenantScopedTableRegistry.Empty, registry);
    }

    [Fact]
    public void RequiresTripleScope_is_false_for_tenant_id_only_table()
    {
        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile(MinimalRegistryJson);

        Assert.False(registry.RequiresTripleScope("dbo.TenantSettings"));
        Assert.True(registry.RequiresTenantIdScope("dbo.TenantSettings"));
    }

    [Fact]
    public void NormalizeTableName_adds_dbo_prefix_for_bare_table_name()
    {
        Assert.Equal("dbo.Runs", TenantScopedTableRegistry.NormalizeTableName("Runs"));
    }
}
