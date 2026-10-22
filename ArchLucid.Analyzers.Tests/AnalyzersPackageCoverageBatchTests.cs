using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchTests
{
    [Fact]
    public void RequireAuthorizationAnalyzer_exposes_al0001()
    {
        RequireAuthorizationAnalyzer analyzer = new();

        Assert.Contains("AL0001", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void TenantIdentityBoundaryAnalyzer_exposes_arch001()
    {
        TenantIdentityBoundaryAnalyzer analyzer = new();

        Assert.Contains("ARCH001", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void MissingCancellationTokenAnalyzer_exposes_arch003()
    {
        MissingCancellationTokenAnalyzer analyzer = new();

        Assert.Contains("ARCH003", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void ForeachToLinqAnalyzer_exposes_al0002()
    {
        ForeachToLinqAnalyzer analyzer = new();

        Assert.Contains("AL0002", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void MutatingControllerAuditAnalyzer_exposes_al0003()
    {
        MutatingControllerAuditAnalyzer analyzer = new();

        Assert.Contains("AL0003", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void DirectHttpClientConstructionAnalyzer_exposes_arch004()
    {
        DirectHttpClientConstructionAnalyzer analyzer = new();

        Assert.Contains("ARCH004", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void MutableStaticAnalyzer_exposes_arch005()
    {
        MutableStaticAnalyzer analyzer = new();

        Assert.Contains("ARCH005", analyzer.SupportedDiagnostics.Select(d => d.Id));
    }

    [Fact]
    public void TenantScopedQueryScopeBindingAnalyzer_exposes_arch006_family()
    {
        TenantScopedQueryScopeBindingAnalyzer analyzer = new();
        IReadOnlyList<string> ids = analyzer.SupportedDiagnostics.Select(d => d.Id).ToList();

        Assert.Contains("ARCH006", ids);
        Assert.Contains("ARCH006a", ids);
        Assert.Contains("ARCH006b", ids);
    }

    [Fact]
    public void Arch006_descriptor_factories_emit_expected_ids()
    {
        Diagnostic unscoped = Arch006Descriptor.CreateUnscopedTable(Location.None, "Runs");
        Diagnostic emptyJustification = Arch006Descriptor.CreateEmptyExemptionJustification(Location.None, "type");

        Assert.Equal("ARCH006", unscoped.Id);
        Assert.Equal("ARCH006b", emptyJustification.Id);
    }
}
