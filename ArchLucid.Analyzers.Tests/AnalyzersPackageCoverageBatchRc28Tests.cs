using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC28 package-coverage batch: tenant-scope exemption attribute helper parse/validate paths.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc28Tests
{
    private const string AttributeStub = """
namespace ArchLucid.Core.Tenancy
{
    public enum TenantScopeExemptReason
    {
        AcceptedResidual = 0,
        SystemPlaneOnly = 1,
        Operational = 2,
    }

    [System.AttributeUsage(System.AttributeTargets.Class | System.AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public sealed class TenantScopeExemptAttribute : System.Attribute
    {
        public TenantScopeExemptAttribute(TenantScopeExemptReason reason) { }

        public TenantScopeExemptAttribute(TenantScopeExemptReason reason, string justification)
        {
            Justification = justification;
        }

        public string Justification { get; set; } = "";
    }
}
""";

    [Fact]
    public void TenantScopeExemptSymbolHelper_TryGetExemption_reads_justified_attribute()
    {
        const string source = AttributeStub + """
public class Probe
{
    [ArchLucid.Core.Tenancy.TenantScopeExempt(
        ArchLucid.Core.Tenancy.TenantScopeExemptReason.Operational,
        "ops inventory job")]
    public void Run() { }
}
""";
        CSharpCompilation compilation = CreateCompilation(source);
        INamedTypeSymbol probe = compilation.GetTypeByMetadataName("Probe")!;
        IMethodSymbol method = probe.GetMembers("Run").OfType<IMethodSymbol>().Single();

        TenantScopeExemptSymbolHelper.ExemptionInfo? exemption =
            TenantScopeExemptSymbolHelper.TryGetExemption(method, compilation);

        exemption.Should().NotBeNull();
        exemption!.Reason.Should().Be(TenantScopeExemptSymbolHelper.TenantScopeExemptReason.Operational);
        exemption.Justification.Should().Be("ops inventory job");
    }

    [Fact]
    public void TenantScopeExemptSymbolHelper_ValidateExemptionAttributes_flags_empty_justification()
    {
        const string source = AttributeStub + """
public class Probe
{
    [ArchLucid.Core.Tenancy.TenantScopeExempt(ArchLucid.Core.Tenancy.TenantScopeExemptReason.AcceptedResidual)]
    public void Run() { }
}
""";
        CSharpCompilation compilation = CreateCompilation(source);
        INamedTypeSymbol probe = compilation.GetTypeByMetadataName("Probe")!;
        IMethodSymbol method = probe.GetMembers("Run").OfType<IMethodSymbol>().Single();

        List<Diagnostic> diagnostics = TenantScopeExemptSymbolHelper
            .ValidateExemptionAttributes(method, compilation)
            .ToList();

        diagnostics.Should().NotBeEmpty();
        diagnostics.Should().Contain(d => d.Id.StartsWith("ARCH006", StringComparison.Ordinal));
    }

    [Fact]
    public void TenantScopeExemptSymbolHelper_TryGetExemption_returns_null_without_attribute()
    {
        const string source = """
public class Probe
{
    public void Run() { }
}
""";
        CSharpCompilation compilation = CreateCompilation(source);
        INamedTypeSymbol probe = compilation.GetTypeByMetadataName("Probe")!;
        IMethodSymbol method = probe.GetMembers("Run").OfType<IMethodSymbol>().Single();

        TenantScopeExemptSymbolHelper.TryGetExemption(method, compilation).Should().BeNull();
    }

    [Fact]
    public void Arch002Descriptor_Rule_is_stable()
    {
        Al0002ForeachToLinqDescriptor.Rule.Id.Should().NotBeNullOrWhiteSpace();
        ForeachToLinqCodeFixProvider provider = new();
        provider.FixableDiagnosticIds.Should().Contain(Al0002ForeachToLinqDescriptor.Rule.Id);
    }

    private static CSharpCompilation CreateCompilation(string source)
    {
        return CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc28",
            [CSharpSyntaxTree.ParseText(source)],
            [
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Attribute).Assembly.Location),
            ],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    }
}
