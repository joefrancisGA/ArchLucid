using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzerDescriptorBatchCoverageTests
{
    [Fact]
    public void Arch001_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("ARCH001", Arch001Descriptor.Rule.Id);
        Assert.Equal("ArchLucid.Architecture", Arch001Descriptor.Rule.Category);
    }

    [Fact]
    public void Arch002_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("ARCH002", Arch002Descriptor.Rule.Id);
        Assert.Equal("ArchLucid.Architecture", Arch002Descriptor.Rule.Category);
    }

    [Fact]
    public void Arch003_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("ARCH003", Arch003Descriptor.Rule.Id);
        Assert.False(string.IsNullOrWhiteSpace(Arch003Descriptor.Rule.Description.ToString()));
    }

    [Fact]
    public void Arch004_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("ARCH004", Arch004Descriptor.Rule.Id);
        Assert.False(string.IsNullOrWhiteSpace(Arch004Descriptor.Rule.MessageFormat.ToString()));
    }

    [Fact]
    public void Arch005_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("ARCH005", Arch005Descriptor.Rule.Id);
        Assert.True(Arch005Descriptor.Rule.IsEnabledByDefault);
    }

    [Fact]
    public void Al0001_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("AL0001", Al0001Descriptor.Rule.Id);
        Assert.Equal("ArchLucid.Security", Al0001Descriptor.Rule.Category);
    }

    [Fact]
    public void Al0002_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("AL0002", Al0002ForeachToLinqDescriptor.Rule.Id);
        Assert.Equal("ArchLucid.Style", Al0002ForeachToLinqDescriptor.Rule.Category);
    }

    [Fact]
    public void Al0003_descriptor_exposes_rule_metadata()
    {
        Assert.Equal("AL0003", Al0003MutatingControllerAuditDescriptor.Rule.Id);
        Assert.Equal("ArchLucid.Security", Al0003MutatingControllerAuditDescriptor.Rule.Category);
    }

    [Fact]
    public void ForeachToLinqKind_exposes_expected_variants()
    {
        Assert.Equal(2, Enum.GetNames(typeof(ForeachToLinqKind)).Length);
        Assert.True(Enum.IsDefined(typeof(ForeachToLinqKind), ForeachToLinqKind.SelectAddRange));
        Assert.True(Enum.IsDefined(typeof(ForeachToLinqKind), ForeachToLinqKind.WhereAddRange));
    }

    [Fact]
    public void Al0001_descriptor_exposes_security_category()
    {
        Assert.Equal("AL0001", Al0001Descriptor.Rule.Id);
        Assert.Contains("Security", Al0001Descriptor.Rule.Category, StringComparison.Ordinal);
    }

    [Fact]
    public void Arch003_descriptor_default_severity_is_warning()
    {
        Assert.Equal("ARCH003", Arch003Descriptor.Rule.Id);
        Assert.Equal(DiagnosticSeverity.Warning, Arch003Descriptor.Rule.DefaultSeverity);
    }

    [Fact]
    public void Arch004_descriptor_has_non_empty_title()
    {
        Assert.Equal("ARCH004", Arch004Descriptor.Rule.Id);
        Assert.False(string.IsNullOrWhiteSpace(Arch004Descriptor.Rule.Title.ToString()));
    }

    [Fact]
    public void Arch005_descriptor_is_enabled_by_default()
    {
        Assert.Equal("ARCH005", Arch005Descriptor.Rule.Id);
        Assert.True(Arch005Descriptor.Rule.IsEnabledByDefault);
    }
}
