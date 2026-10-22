using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch3Tests
{
    [Fact]
    public void NakedDateTimeAnalyzer_exposes_arch002_descriptor()
    {
        NakedDateTimeAnalyzer analyzer = new();

        analyzer.SupportedDiagnostics.Should().ContainSingle(descriptor => descriptor.Id == "ARCH002");
    }

    [Fact]
    public void ForeachToLinqMatch_exposes_struct_properties()
    {
        ForeachToLinqKind kind = ForeachToLinqKind.SelectAddRange;

        kind.Should().Be(ForeachToLinqKind.SelectAddRange);
        Enum.IsDefined(typeof(ForeachToLinqKind), ForeachToLinqKind.WhereAddRange).Should().BeTrue();
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_returns_unresolved_for_null_expression()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            TenantScopedSqlExpressionResolver.Resolve(expression: null, semanticModel: null!);

        result.IsStaticallyResolved.Should().BeFalse();
        result.SqlText.Should().BeNull();
    }

    [Fact]
    public void Arch006Descriptor_create_empty_exemption_emits_arch006b()
    {
        Diagnostic diagnostic = Arch006Descriptor.CreateEmptyExemptionJustification(Location.None, "method");

        diagnostic.Id.Should().Be("ARCH006b");
        diagnostic.GetMessage().Should().Contain("method");
    }
}
