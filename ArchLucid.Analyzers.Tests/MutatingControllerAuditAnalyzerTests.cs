using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class MutatingControllerAuditAnalyzerTests
{
    /// <summary>
    /// Minimal <c>ArchLucid.Core.Audit</c> + MVC HTTP verb attributes so analyzer metadata names resolve without
    /// wiring the full ASP.NET Core reference set into the ephemeral test compilation.
    /// </summary>
    private const string AuditAndMvcStubs = """

namespace ArchLucid.Core.Audit
{
    public sealed class AuditEvent
    {
        public string EventType { get; set; } = string.Empty;
    }

    public interface IAuditService
    {
        System.Threading.Tasks.Task LogAsync(AuditEvent auditEvent, System.Threading.CancellationToken ct);
    }

    [System.AttributeUsage(System.AttributeTargets.Method | System.AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
    public sealed class MutatingAuditExcludedAttribute : System.Attribute
    {
        public MutatingAuditExcludedAttribute(string? reason = null)
        {
            Reason = reason ?? string.Empty;
        }

        public string Reason { get; }
    }
}

namespace Microsoft.AspNetCore.Mvc
{
    public interface IActionResult { }

    public abstract class ControllerBase
    {
        protected IActionResult Ok() => throw null!;
    }

    public sealed class HttpGetAttribute : System.Attribute { }

    public sealed class HttpPostAttribute : System.Attribute
    {
        public HttpPostAttribute(string? template = null) { }
    }

    public sealed class HttpPutAttribute : System.Attribute { }

    public sealed class HttpDeleteAttribute : System.Attribute { }

    public sealed class NonActionAttribute : System.Attribute { }
}

""";

    [Fact]
    public async Task AL0003_reports_when_HttpPost_action_lacks_IAudit_LogAsync()
    {
        string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class IgnoresAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public System.Threading.Tasks.Task<IActionResult> Breaks(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithSpan(57, 55, 57, 61)
                .WithArguments("ArchLucid.Api.Probe.IgnoresAuditController.Breaks");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_awaited()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class AuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> OkPost(System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent { EventType = "Probe" },
            cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Allowlist_additional_text_suppresses_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ListedController(IAuditService auditService) : ControllerBase
{
    [HttpPost]
    public System.Threading.Tasks.Task<IActionResult> Allowlisted(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            TestState =
            {
                AdditionalFiles =
                {
                    ("controller_action_audit_allowlist.txt",
                        Microsoft.CodeAnalysis.Text.SourceText.From(
                            "ArchLucid.Api.Probe.ListedController.Allowlisted")),
                },
            },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi },
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_attribute_suppresses_AL0003()
    {
        string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ExcludedController : ControllerBase
{
    [HttpPost]
    [MutatingAuditExcluded("test harness")]
    public IActionResult Bypass()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Http_Get_actions_do_not_require_audit()
    {
        string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ReadOnlyController(IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public IActionResult Read()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    private static Solution MarkAssemblyAsArchLucidApi(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");
}
