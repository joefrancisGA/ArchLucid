using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

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

    [Fact]
    public async Task Flags_non_readonly_static_field_in_AgentRuntime()
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
            SolutionTransforms = { AgentRuntimeAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Flags_static_property_with_public_setter()
    {
        const string testCode = """
namespace N;

public static class C
{
    public static int Prop { get; set; }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutableStaticAnalyzer, DefaultVerifier>.Diagnostic(Arch005Descriptor.Rule)
            .WithSpan(5, 23, 5, 27)
            .WithArguments("N.C.Prop");

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
    public async Task Does_not_flag_thread_static_field()
    {
        const string testCode = """
using System;

namespace N;

public static class C
{
    [ThreadStatic]
    static int OkField;
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

    private static Solution ApplicationAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

    private static Solution OtherAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Core");

    private static Solution AgentRuntimeAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.AgentRuntime");
}
