using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch4Tests
{
    [Fact]
    public void Descriptor_Create_factories_emit_expected_rule_ids()
    {
        Location loc = Location.None;

        Arch001Descriptor.Create(loc, "IHttpContextAccessor").Id.Should().Be("ARCH001");
        Arch002Descriptor.Create(loc, "DateTime.Now").Id.Should().Be("ARCH002");
        Arch003Descriptor.Create(loc, "M()").Id.Should().Be("ARCH003");
        Arch004Descriptor.Create(loc).Id.Should().Be("ARCH004");
        Arch005Descriptor.Create(loc, "StaticMutable").Id.Should().Be("ARCH005");
        Al0001Descriptor.Create(loc, "Controller.Action").Id.Should().Be("AL0001");
        Al0002ForeachToLinqDescriptor.Create(loc, "SelectAddRange").Id.Should().Be("AL0002");
        Al0003MutatingControllerAuditDescriptor.Create(loc, "Controller.Post").Id.Should().Be("AL0003");
        Arch006Descriptor.CreateUnscopedTable(loc, "dbo.Runs").Id.Should().Be("ARCH006");
    }

    [Fact]
    public void Analyzer_constructors_expose_supported_diagnostics()
    {
        new TenantIdentityBoundaryAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "ARCH001");
        new NakedDateTimeAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "ARCH002");
        new MissingCancellationTokenAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "ARCH003");
        new DirectHttpClientConstructionAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "ARCH004");
        new MutableStaticAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "ARCH005");
        new RequireAuthorizationAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "AL0001");
        new ForeachToLinqAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "AL0002");
        new MutatingControllerAuditAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id == "AL0003");
        new TenantScopedQueryScopeBindingAnalyzer().SupportedDiagnostics.Should().Contain(d => d.Id.StartsWith("ARCH006"));
    }
}
