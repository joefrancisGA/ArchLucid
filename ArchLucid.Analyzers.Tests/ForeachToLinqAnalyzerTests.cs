using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

public sealed class ForeachToLinqAnalyzerTests
{
    [Fact]
    public async Task CodeFix_replaces_projection_loop_with_Select_AddRange()
    {
        const string beforeSource = """

using System.Collections.Generic;

internal static class Accumulator
{
    internal static void M()
    {
        List<int> target = [];
        int[] inputs = new int[] { 1, 2 };

        foreach (int x in inputs)
            target.Add(x + 10);
    }
}

""";

        const string fixedSourceWithLinq = """

using System.Collections.Generic;
using System.Linq;

internal static class Accumulator
{
    internal static void M()
    {
        List<int> target = [];
        int[] inputs = new int[] { 1, 2 };

        target.AddRange(inputs.Select(x => x + 10));
    }
}

""";

        DiagnosticResult diagnostic =
            CSharpCodeFixVerifier<ForeachToLinqAnalyzer, ForeachToLinqCodeFixProvider, DefaultVerifier>
                .Diagnostic(Al0002ForeachToLinqDescriptor.Rule)
                .WithSpan(11, 9, 11, 16)
                .WithArguments(ForeachToLinqAnalyzer.SelectSummary);

        CSharpCodeFixTest<ForeachToLinqAnalyzer, ForeachToLinqCodeFixProvider, DefaultVerifier> verifier = new()
        {
            TestCode = beforeSource,
            FixedCode = fixedSourceWithLinq,
            ExpectedDiagnostics = { diagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { RenameTestProjectToAnalyzableAssembly }
        };

        await verifier.RunAsync();
    }

    [Fact]
    public async Task CodeFix_replaces_filtered_loop_with_Where_AddRange()
    {
        const string beforeSource = """

using System.Collections.Generic;

internal static class Accumulator
{
    internal static void M()
    {
        List<int> target = [];
        int[] inputs = new int[] { -1, 2 };

        foreach (int x in inputs)
            if (x > 0)
                target.Add(x);
    }
}

""";

        const string fixedSourceWithLinq = """

using System.Collections.Generic;
using System.Linq;

internal static class Accumulator
{
    internal static void M()
    {
        List<int> target = [];
        int[] inputs = new int[] { -1, 2 };

        target.AddRange(inputs.Where(x => x > 0));
    }
}

""";

        DiagnosticResult diagnostic =
            CSharpCodeFixVerifier<ForeachToLinqAnalyzer, ForeachToLinqCodeFixProvider, DefaultVerifier>
                .Diagnostic(Al0002ForeachToLinqDescriptor.Rule)
                .WithSpan(11, 9, 11, 16)
                .WithArguments(ForeachToLinqAnalyzer.WhereSummary);

        CSharpCodeFixTest<ForeachToLinqAnalyzer, ForeachToLinqCodeFixProvider, DefaultVerifier> verifier = new()
        {
            TestCode = beforeSource,
            FixedCode = fixedSourceWithLinq,
            ExpectedDiagnostics = { diagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { RenameTestProjectToAnalyzableAssembly }
        };

        await verifier.RunAsync();
    }

    [Fact]
    public async Task Does_not_emit_for_test_named_assembly_without_transform()
    {
        const string beforeSource = """

using System.Collections.Generic;

internal static class Accumulator
{
    internal static void M()
    {
        List<int> target = [];
        int[] inputs = new int[] { 1 };

        foreach (int x in inputs)
            target.Add(x);
    }
}

""";

        CSharpAnalyzerTest<ForeachToLinqAnalyzer, DefaultVerifier> verifier = new()
        {
            TestCode = beforeSource,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { MarkProjectAsAnalyzersTestsConvention }
        };

        await verifier.RunAsync();
    }

    private static Solution MarkProjectAsAnalyzersTestsConvention(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "Regression.Tests");

    private static Solution RenameTestProjectToAnalyzableAssembly(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");
}
