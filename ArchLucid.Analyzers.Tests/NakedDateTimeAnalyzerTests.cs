using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class NakedDateTimeAnalyzerTests
{
    [Fact]
    public async Task Reports_DateTime_UtcNow_in_inner_assembly()
    {
        const string testCode = """
namespace N;

public sealed class C
{
    void M()
    {
        var _ = System.DateTime.UtcNow;
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<NakedDateTimeAnalyzer, DefaultVerifier>.Diagnostic(Arch002Descriptor.Rule)
            .WithSpan(7, 33, 7, 39)
            .WithArguments("System.DateTime.UtcNow");

        CSharpAnalyzerTest<NakedDateTimeAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_in_host_allow_listed_assembly()
    {
        const string testCode = """
namespace N;

public sealed class C
{
    void M()
    {
        var _ = System.DateTime.UtcNow;
    }
}
""";

        CSharpAnalyzerTest<NakedDateTimeAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { HostAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_TimeProvider_or_IClock_usage()
    {
        const string testCode = """
using System;

namespace N;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class C
{
    void M(TimeProvider tp, IClock clock)
    {
        var _ = tp.GetUtcNow();
        var __ = clock.UtcNow;
    }
}
""";

        CSharpAnalyzerTest<NakedDateTimeAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    private static Solution InnerLayerAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

    private static Solution HostAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Host.Web");
}
