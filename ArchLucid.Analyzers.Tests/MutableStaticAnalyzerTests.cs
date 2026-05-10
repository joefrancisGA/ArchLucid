using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class MutableStaticAnalyzerTests
{
    [Fact]
    public async Task Flags_non_readonly_static_field_in_Application()
    {
        const string testCode = """
namespace N;

public static class C
{
    static int BadField;
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutableStaticAnalyzer, DefaultVerifier>.Diagnostic(Arch005Descriptor.Rule)
            .WithSpan(5, 16, 5, 24)
            .WithArguments("N.C.BadField");

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { ApplicationAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_flag_static_readonly_field()
    {
        const string testCode = """
namespace N;

public static class C
{
    static readonly int OkField = 1;
}
""";

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { ApplicationAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_flag_in_non_Application_assembly()
    {
        const string testCode = """
namespace N;

public static class C
{
    static int BadField;
}
""";

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { OtherAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    private static Solution ApplicationAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

    private static Solution OtherAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Core");
}
