using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Backfill.Cli;
using ArchLucid.Capabilities.Cost;
using ArchLucid.Cli;
using ArchLucid.ContextIngestion;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Notifications;
using ArchLucid.Persistence;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Queries;
using ArchLucid.TestSupport;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]

/// <summary>NetArchTest + assembly-reference checks for layer boundaries. One <see cref="FactAttribute"/> per rule for clear CI output.</summary>
public sealed class DependencyConstraintTests
{
    // ── Tier 1 — Foundation isolation ─────────────────────────────────────────

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Core_must_not_depend_on_any_solution_project()
    {
        Assembly core = typeof(IntegrationEventTypes).Assembly;

        // Phase 5 (#33) lifted persistence ports into Core under ArchLucid.Persistence.* namespaces;
        // NetArchTest namespace matching would false-positive on those shims (same pattern as Api vs Retrieval).
        string[] forbiddenWithoutPersistenceNamespaceShims = ArchitectureConstraintNamespaces.ForbiddenFromCore
            .Where(static n => !string.Equals(n, "ArchLucid.Persistence", StringComparison.Ordinal))
            .ToArray();

        TestResult result = Types
            .InAssembly(core)
            .ShouldNot()
            .HaveDependencyOnAny(forbiddenWithoutPersistenceNamespaceShims)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "ArchLucid.Core is the foundation leaf; referencing other ArchLucid assemblies couples infrastructure and domain into the kernel. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Core_must_not_reference_Persistence_assembly()
    {
        Assembly core = typeof(IntegrationEventTypes).Assembly;
        AssemblyName[] references = core.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Persistence",
            because:
            "Core holds persistence port interfaces under ArchLucid.Persistence.* namespaces but must not reference the Persistence implementation assembly.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Contracts_must_not_depend_on_any_solution_project()
    {
        Assembly contracts = typeof(ArchitectureRun).Assembly;

        TestResult result = Types
            .InAssembly(contracts)
            .ShouldNot()
            .HaveDependencyOnAny(ArchitectureConstraintNamespaces.ForbiddenFromContracts)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "ArchLucid.Contracts is a shared DTO leaf; it must not reference application, persistence, or hosts. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Core_must_not_reference_Notifications_assembly()
    {
        Assembly core = typeof(IntegrationEventTypes).Assembly;
        AssemblyName[] references = core.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Notifications",
            because: "Core is the foundation leaf; webhook contracts live in ArchLucid.Notifications without a Core assembly reference.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Contracts_must_not_reference_Notifications_assembly()
    {
        Assembly contracts = typeof(ArchitectureRun).Assembly;
        AssemblyName[] references = contracts.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Notifications",
            because: "Contracts stays a shared DTO leaf; outbound HTTP posting is not a Contracts concern.");
    }

    // ── Tier 2 — Persistence physical consolidation (2026-05) ─────────────────
    // Former ArchLucid.Persistence.{Coordination,Advisory,Alerts,Integration,Runtime} assemblies were merged into
    // ArchLucid.Persistence; cross-assembly dependency rules for those slices are retired.

    // ── Tier 3 — Domain hexagonal boundary ───────────────────────────────────

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Decisioning_must_not_depend_on_Persistence()
    {
        Assembly decisioning = typeof(AlertEvaluator).Assembly;

        TestResult result = Types
            .InAssembly(decisioning)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Decisioning is domain logic; any ArchLucid.Persistence dependency (base or sub-module) breaks hexagonal isolation. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Notifications_must_not_depend_on_Persistence()
    {
        Assembly notifications = typeof(IWebhookPoster).Assembly;

        TestResult result = Types
            .InAssembly(notifications)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Notifications is a thin outbound-delivery contract assembly; SQL/Dapper must stay in persistence. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void KnowledgeGraph_must_not_depend_on_Persistence()
    {
        Assembly knowledgeGraph = typeof(GraphNodeTypes).Assembly;

        TestResult result = Types
            .InAssembly(knowledgeGraph)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "KnowledgeGraph stays in the domain/application seam without SQL/Dapper types. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void ContextIngestion_must_not_depend_on_Persistence()
    {
        Assembly contextIngestion = typeof(SupportedContextDocumentContentTypes).Assembly;

        TestResult result = Types
            .InAssembly(contextIngestion)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Context ingestion models documents and must not reference persistence implementations. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void ArtifactSynthesis_must_not_depend_on_Persistence()
    {
        Assembly synthesis = typeof(ArtifactSynthesisService).Assembly;

        TestResult result = Types
            .InAssembly(synthesis)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Artifact synthesis generates outputs from domain inputs and must not touch persistence. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Decisioning_must_not_depend_on_ArtifactSynthesis()
    {
        Assembly decisioning = typeof(AlertEvaluator).Assembly;

        TestResult result = Types
            .InAssembly(decisioning)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.ArtifactSynthesis")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "TB-031 Option A: ArtifactSynthesis sits above Decisioning; reverse dependency would risk cycles. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void ArtifactSynthesis_csproj_references_Decisioning_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.ArtifactSynthesis", "ArchLucid.ArtifactSynthesis.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.Decisioning",
            because: "TB-031 Option A: ArtifactSynthesis consumes Decisioning types; Decisioning must not reference ArtifactSynthesis.");
    }

    // ── Tier 4 — CLI isolation ────────────────────────────────────────────────

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Cli_must_not_depend_on_Persistence()
    {
        Assembly cli = typeof(ManifestValidator).Assembly;

        TestResult result = Types
            .InAssembly(cli)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "The CLI is a thin host over HTTP clients and contracts; it must not embed persistence. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Cli_must_not_reference_Api_assembly()
    {
        // NetArchTest HaveDependencyOn("ArchLucid.Api") also matches ArchLucid.Api.Client.* — enforce the host assembly boundary via metadata.
        Assembly cli = typeof(ManifestValidator).Assembly;
        AssemblyName[] references = cli.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Api",
            because: "The CLI must not reference the ASP.NET host assembly; HTTP types come from ArchLucid.Api.Client only.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Product_code_must_not_call_IIntegrationEventPublisher_PublishAsync_outside_authorized_wrappers()
    {
        string? root = FindRepositoryRootContainingSolution();

        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        Regex directPublish = new(@"\.PublishAsync\(", RegexOptions.Compiled);
        List<string> violations = [];

        foreach (string path in Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories))
        {
            if (IsExcludedSourceScanPath(path))
            {
                continue;
            }

            if (IsAuthorizedDirectIntegrationPublishFile(path))
            {
                continue;
            }

            string[] lines = File.ReadAllLines(path);

            for (int i = 0; i < lines.Length; i++)
            {
                string line = lines[i];
                string trimmed = line.TrimStart();

                if (trimmed.StartsWith("//", StringComparison.Ordinal)
                    || trimmed.StartsWith("///", StringComparison.Ordinal)
                    || trimmed.StartsWith('*'))
                {
                    continue;
                }

                if (!directPublish.IsMatch(line))
                {
                    continue;
                }

                violations.Add($"{path}:{i + 1}: {line.Trim()}");
            }
        }

        violations.Should().BeEmpty(
            "integration events must go through OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync; " +
            "only IntegrationEventPublishing (TryPublishAsync) and IntegrationEventOutboxProcessor may call IIntegrationEventPublisher.PublishAsync directly. Violations:{0}{1}",
            Environment.NewLine,
            violations.Count == 0 ? "(none)" : string.Join(Environment.NewLine, violations));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_references_Core_for_consolidated_audit_event_type_catalog()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().Contain(
            a => a.Name == "ArchLucid.Core",
            because: "Application orchestrators use ArchLucid.Core.Audit.AuditEventTypes.Baseline for trusted-baseline mutation strings (single catalog with durable AuditEventTypes).");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_Retrieval()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Retrieval")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference Retrieval; Coordination owns that edge. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_must_not_depend_on_Application_outside_explanation_ports()
    {
        // AgentRuntime.Explanation implements Application.Explanation port interfaces
        // (IExplanationService, IRunExplanationSummaryService) — that dependency is the
        // correct adapter→port direction in hexagonal architecture and is therefore allowed.
        // Every OTHER namespace in AgentRuntime must stay decoupled from Application.
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;

        TestResult result = Types
            .InAssembly(agentRuntime)
            .That()
            .DoNotResideInNamespace("ArchLucid.AgentRuntime.Explanation")
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Application")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Only AgentRuntime.Explanation may implement Application.Explanation ports; " +
                     "all other AgentRuntime types must not reference Application orchestration. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Retrieval_must_not_depend_on_Persistence()
    {
        Assembly retrieval = typeof(RetrievalQueryService).Assembly;

        TestResult result = Types
            .InAssembly(retrieval)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Retrieval stays above SQL/Dapper. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Legacy_CoordinatorRun_audit_constants_are_removed_from_AuditEventTypes()
    {
        List<string> names = typeof(AuditEventTypes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(f => f is { IsLiteral: true, IsInitOnly: false } && f.FieldType == typeof(string))
            .Select(f => f.Name)
            .ToList();

        names.Should().NotContain(
            n => n.StartsWith("CoordinatorRun", StringComparison.Ordinal),
            "legacy CoordinatorRun* durable constants were removed; use AuditEventTypes.Run.*");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_AgentSimulator_assembly()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.AgentSimulator",
            because: "IAgentExecutor lives in Contracts.Abstractions; Application must not depend on the simulator package.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_assembly_must_not_export_GovernanceAuditEventTypes()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        application.GetExportedTypes()
            .Select(t => t.Name)
            .Should()
            .NotContain("GovernanceAuditEventTypes", "use AuditEventTypes.Baseline.Governance only");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_must_not_depend_on_AgentRuntime()
    {
        Assembly api = typeof(ArchLucid.Api.Program).Assembly;

        TestResult result = Types
            .InAssembly(api)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.AgentRuntime")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "API reaches agents via Application and host DI only. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Worker_must_not_reference_Api_assembly()
    {
        Assembly worker = typeof(ArchLucid.Worker.Program).Assembly;
        AssemblyName[] references = worker.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Api",
            because: "Worker composes Host paths and contracts; it must not reference the HTTP host assembly.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_Host_Composition_assembly()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Host.Composition",
            because: "Application stays host-agnostic; composition is a host concern.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_host_advisory_orchestration_services_in_exported_artifacts()
    {
        Assembly persistence = typeof(DapperAdvisoryScanScheduleRepository).Assembly;

        persistence.GetExportedTypes()
            .Select(t => t.Name)
            .Should()
            .NotContain(
                ["AdvisoryScanRunner", "RecommendationLearningService"],
                because: "orchestration lives in ArchLucid.Application.Advisory; ArchLucid.Persistence hosts SQL adapters only.");
    }

    // ── Tier 6 — New gap coverage ─────────────────────────────────────────────

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Cli_must_not_reference_Application_assembly()
    {
        // GoldenCohort data types moved to Core.GoldenCorpus; Cli is now a thin HTTP-client
        // host that should compose over Api.Client and Contracts only.
        Assembly cli = typeof(ManifestValidator).Assembly;
        AssemblyName[] references = cli.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Application",
            because: "Cli is a thin host over ArchLucid.Api.Client; data utilities belong in Core.GoldenCorpus not Application.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Cli_must_not_reference_Coordinator_assembly()
    {
        Assembly cli = typeof(ManifestValidator).Assembly;
        AssemblyName[] references = cli.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Coordinator",
            because: "Cli must not pull in domain orchestration layers; HTTP transport via Api.Client is the correct boundary.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_Explanation_may_only_import_Application_Explanation_namespace()
    {
        // Positive complement of AgentRuntime_must_not_depend_on_Application_outside_explanation_ports.
        // Verify that the one allowed cross-boundary import stays scoped to Application.Explanation.
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;

        TestResult result = Types
            .InAssembly(agentRuntime)
            .That()
            .ResideInNamespace("ArchLucid.AgentRuntime.Explanation")
            .ShouldNot()
            .HaveDependencyOnAny(
                "ArchLucid.Application.Runs",
                "ArchLucid.Application.Advisory",
                "ArchLucid.Application.Analysis",
                "ArchLucid.Application.Governance",
                "ArchLucid.Application.GoldenCohort",
                "ArchLucid.Application.Pilots",
                "ArchLucid.Application.Notifications",
                "ArchLucid.Application.Marketing",
                "ArchLucid.Application.Common")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "AgentRuntime.Explanation may implement Application.Explanation port interfaces only; " +
                     "it must not reach into Application orchestration or use-case namespaces. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    // ── Tier 7 — Internal implementation namespaces (INV-001 host seam, hexagonal persistence) ──

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_depend_on_Persistence_Repositories_implementation_namespace()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        TestResult result = Types
            .InAssembly(application)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence.Repositories")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Application depends on persistence ports (Interfaces, Models, Data.Repositories contracts); "
                     + "Sql*/Caching* repository implementations belong in ArchLucid.Persistence.Repositories and composition only. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_must_not_depend_on_Persistence_Repositories_implementation_namespace()
    {
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;

        TestResult result = Types
            .InAssembly(agentRuntime)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence.Repositories")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "AgentRuntime may use persistence query/trace ports but must not reference concrete repository types "
                     + "under ArchLucid.Persistence.Repositories (host registers those adapters). Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_depend_on_Api_Middleware_namespace()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        TestResult result = Types
            .InAssembly(application)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Api.Middleware")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "HTTP middleware is composed only in ArchLucid.Api (see INV-001 tenant/host boundary sketch); "
                     + "Application must not take a dependency on ArchLucid.Api.Middleware types. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_must_not_reference_AgentSimulator_assembly()
    {
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;
        AssemblyName[] references = agentRuntime.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.AgentSimulator",
            because: "TB-027: AgentRuntime depends on IAgentExecutor and Core deterministic scenarios only; AgentSimulator is wired at Host.Composition.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Capabilities_Cost_must_not_reference_AgentSimulator_assembly()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Capabilities.Cost", "ArchLucid.Capabilities.Cost.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.AgentSimulator",
            because: "TB-027: Capabilities.Cost uses Core.FakeScenarioFactory; AgentSimulator is composition-root only.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Host_Core_must_not_reference_AgentSimulator_assembly()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Host.Core", "ArchLucid.Host.Core.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.AgentSimulator",
            because: "TB-027: simulator wiring belongs in Host.Composition only.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentSimulator_may_only_be_referenced_by_allowlisted_assemblies()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        HashSet<string> allowlisted = new(StringComparer.Ordinal)
        {
            "ArchLucid.Host.Composition",
        };

        List<string> violations = [];

        foreach (string csprojPath in Directory.EnumerateFiles(root!, "*.csproj", SearchOption.AllDirectories))
        {
            string assemblyName = Path.GetFileNameWithoutExtension(csprojPath);

            if (string.Equals(assemblyName, "ArchLucid.AgentSimulator", StringComparison.Ordinal))
            {
                continue;
            }

            string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

            if (!declaredReferences.Contains("ArchLucid.AgentSimulator", StringComparer.Ordinal))
            {
                continue;
            }

            bool allowed = allowlisted.Contains(assemblyName)
                           || assemblyName.EndsWith(".Tests", StringComparison.Ordinal);

            if (!allowed)
            {
                violations.Add(assemblyName);
            }
        }

        violations.Should().BeEmpty(
            because: "TB-027 positive-list: only Host.Composition and *.Tests may reference AgentSimulator via csproj; violations: {0}",
            string.Join(", ", violations));
    }

    // ── Tier 9 — TB-030 gap closure (Mcp, AzureExtractor, Jobs.Cli, integrations) ──

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Mcp_must_not_depend_on_Application_layer_namespaces()
    {
        Assembly mcp = typeof(ArchLucid.Mcp.Tools.RetrievalTools).Assembly;

        TestResult result = Types
            .InAssembly(mcp)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Application")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Mcp tools delegate to Retrieval/Core ports only. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Mcp_must_not_depend_on_Persistence()
    {
        Assembly mcp = typeof(ArchLucid.Mcp.Tools.RetrievalTools).Assembly;

        TestResult result = Types
            .InAssembly(mcp)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Mcp must stay above SQL/Dapper. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Mcp_csproj_must_not_reference_Application_or_Persistence()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Mcp", "ArchLucid.Mcp.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.Application",
            because: "Mcp must not take a direct ProjectReference to Application.");

        declaredReferences.Should().NotContain(
            "ArchLucid.Persistence",
            because: "Mcp must not take a direct ProjectReference to Persistence.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Integrations_must_not_depend_on_Application()
    {
        Assembly azureExtractor = typeof(ArchLucid.Integrations.AzureExtractor.HostedAzureExtractorClient).Assembly;
        Assembly azureDevOps = typeof(ArchLucid.Integrations.AzureDevOps.AzureDevOpsCommitStatusPublisher).Assembly;

        foreach (Assembly integration in new[] { azureExtractor, azureDevOps })
        {
            TestResult result = Types
                .InAssembly(integration)
                .ShouldNot()
                .HaveDependencyOn("ArchLucid.Application")
                .GetResult();

            result.IsSuccessful.Should().BeTrue(
                because: "{0} is an infrastructure adapter and must not reference Application. Offending types: {1}",
                integration.GetName().Name,
                FormatFailingTypeNames(result));
        }
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Integrations_csproj_must_not_reference_Application()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        foreach (string projectDir in new[] { "ArchLucid.Integrations.AzureExtractor", "ArchLucid.Integrations.AzureDevOps" })
        {
            string csprojPath = Path.Combine(root!, projectDir, $"{projectDir}.csproj");
            string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

            declaredReferences.Should().NotContain(
                "ArchLucid.Application",
                because: "{0} must not declare a ProjectReference to Application.", projectDir);
        }
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_csproj_references_Integrations_AzureExtractor_by_design_until_TB_028()
    {
        // ApiWebLayerServiceCollectionExtensions still registers HostedAzureExtractorClient types directly.
        // TB-028 moves that wiring to Host.Composition and deletes this direct ProjectReference.
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Api", "ArchLucid.Api.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.Integrations.AzureExtractor",
            because: "documented until TB-028 removes the Api → AzureExtractor direct reference.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Jobs_Cli_must_not_depend_on_Application_directly()
    {
        Assembly jobsCli = typeof(ArchLucid.Jobs.Cli.Program).Assembly;

        TestResult result = Types
            .InAssembly(jobsCli)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Application")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Jobs.Cli must reach Application only via Host.Composition. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Notifications_Email_RazorLight_must_not_depend_on_Application_or_above()
    {
        Assembly razorLight = typeof(ArchLucid.Notifications.Email.RazorLight.RazorLightEmailTemplateRenderer).Assembly;

        TestResult result = Types
            .InAssembly(razorLight)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Application")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Email template adapter stays at infrastructure tier. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    // ── Tier 8 — Dependency graph gap closure (2026-05-23; #16 Provenance + Capabilities.Cost 2026-05-25) ──
    // Persistence adapters must depend only on ArchLucid.Contracts + ArchLucid.Core (see ArchLucid.Persistence.csproj).
    // NetArchTest guards below fail if domain assemblies leak into the persistence tier; csproj guards catch ProjectReference regressions before compile.

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_Decisioning()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Decisioning")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference Decisioning domain assemblies. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_ArtifactSynthesis()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.ArtifactSynthesis")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference ArtifactSynthesis. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_ContextIngestion()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.ContextIngestion")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference ContextIngestion. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_KnowledgeGraph()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.KnowledgeGraph")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference KnowledgeGraph. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_Provenance()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Provenance")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference Provenance (Improvement #16 hexagonal guard). Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_Capabilities_Cost()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Capabilities.Cost")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference Capabilities.Cost (Improvement #16 hexagonal guard). Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_csproj_must_not_reference_Provenance_or_Capabilities_Cost_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Persistence", "ArchLucid.Persistence.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.Provenance",
            because: "Persistence csproj must not reference Provenance; use Contracts ports and Application orchestration (Improvement #16).");

        declaredReferences.Should().NotContain(
            "ArchLucid.Capabilities.Cost",
            because: "Persistence csproj must not reference Capabilities.Cost; cost agents stay in the domain tier (Improvement #16).");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Persistence_must_not_depend_on_Notifications()
    {
        Assembly persistence = typeof(SqlRunRepository).Assembly;

        TestResult result = Types
            .InAssembly(persistence)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Notifications")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Persistence must not reference Notifications. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_Integrations_AzureExtractor_assembly()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Integrations.AzureExtractor",
            because: "Application must not reference Integrations.AzureExtractor directly; use ports in Contracts.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_Persistence_assembly()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Persistence",
            because: "Application must depend on repository ports in Contracts, not the Persistence assembly.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_must_not_depend_on_Decisioning()
    {
        Assembly api = typeof(ArchLucid.Api.Program).Assembly;

        TestResult result = Types
            .InAssembly(api)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Decisioning")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Api must not depend on Decisioning. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_must_not_depend_on_KnowledgeGraph()
    {
        Assembly api = typeof(ArchLucid.Api.Program).Assembly;

        TestResult result = Types
            .InAssembly(api)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.KnowledgeGraph")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Api must not depend on KnowledgeGraph. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_must_not_depend_on_Retrieval()
    {
        // NetArchTest HaveDependencyOn("ArchLucid.Retrieval") also matches ArchLucid.Core.Retrieval.* port
        // types (IRetrievalQueryService, RetrievalHit, etc.) — enforce the implementation assembly boundary via metadata.
        Assembly api = typeof(ArchLucid.Api.Program).Assembly;
        AssemblyName[] references = api.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Retrieval",
            because: "Api must depend on retrieval ports in Core, not the Retrieval implementation assembly.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Cli_must_not_depend_on_Decisioning()
    {
        Assembly cli = typeof(ManifestValidator).Assembly;

        TestResult result = Types
            .InAssembly(cli)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Decisioning")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Cli must not depend on Decisioning. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    // ── Tier 4b — Backfill.Cli maintenance host (documented Application bypass) ──

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void BackfillCli_first_party_assembly_references_must_match_allowlist()
    {
        Assembly backfillCli = typeof(BackfillCliAssemblyAnchor).Assembly;
        string[] directFirstPartyReferences = backfillCli
            .GetReferencedAssemblies()
            .Select(static a => a.Name)
            .Where(static name => name is not null && name.StartsWith("ArchLucid.", StringComparison.Ordinal))
            .Select(static name => name!)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        directFirstPartyReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.DirectFirstPartyAssembliesForBackfillCli,
            because:
            "Backfill.Cli may reference only Core, Contracts, KnowledgeGraph, and Persistence at assembly metadata. " +
            "See docs/library/SqlRelationalBackfill.md and docs/library/ARCHITECTURE_CONSTRAINTS.md.");

        string[] transitiveFirstPartyReferences = CollectTransitiveFirstPartyAssemblyReferences(backfillCli)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        transitiveFirstPartyReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.AllowedFirstPartyAssembliesForBackfillCli,
            because:
            "Backfill.Cli is a one-time migration host that composes SqlRelationalBackfillService directly; " +
            "it must not pull in Application, Api, Host.*, or other product layers.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void BackfillCli_csproj_must_only_declare_allowed_project_references()
    {
        string? root = FindRepositoryRootContainingSolution();

        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Backfill.Cli", "ArchLucid.Backfill.Cli.csproj");
        File.Exists(csprojPath).Should().BeTrue(because: "Backfill.Cli project file must exist at {0}", csprojPath);

        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        declaredReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.DirectProjectReferencesForBackfillCli,
            because:
            "Backfill.Cli must declare only Persistence + KnowledgeGraph project references; " +
            "transitive Core/Contracts references come from those leaves.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void BackfillCli_must_not_depend_on_Application()
    {
        Assembly backfillCli = typeof(BackfillCliAssemblyAnchor).Assembly;

        TestResult result = Types
            .InAssembly(backfillCli)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Application")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because:
            "Backfill.Cli is a maintenance host over Persistence.Coordination.Backfill, not an Application use-case. " +
            "Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_must_not_reference_Persistence_assembly()
    {
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;
        AssemblyName[] references = agentRuntime.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Persistence",
            because: "AgentRuntime must use ports, not the Persistence assembly.");
    }

    // ── Tier 9 — Dependency graph gap closure (2026-05-24, Improvement #53) ───

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Provenance_must_not_depend_on_Persistence()
    {
        Assembly provenance = typeof(ProvenanceBuilder).Assembly;

        TestResult result = Types
            .InAssembly(provenance)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Provenance is domain logic; SQL/Dapper types belong in persistence adapters only (INV hexagonal tier-3 guard). Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_csproj_must_not_declare_Decisioning_project_reference()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Api", "ArchLucid.Api.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.Decisioning",
            because: "Api must reach decisioning through Application orchestration, not a direct csproj reference (INV host seam).");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Api_csproj_must_not_declare_KnowledgeGraph_project_reference()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Api", "ArchLucid.Api.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.KnowledgeGraph",
            because: "Api must depend on graph ports in Contracts/Core, not a direct KnowledgeGraph csproj reference.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_SqlClient_or_Dapper_assemblies()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "Microsoft.Data.SqlClient",
            because: "Application orchestrates use cases; Microsoft.Data.SqlClient belongs in ArchLucid.Persistence only.");

        references.Should().NotContain(
            a => a.Name == "Dapper",
            because: "Application orchestrates use cases; Dapper belongs in ArchLucid.Persistence only.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Application_must_not_reference_Notifications_assembly()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        AssemblyName[] references = application.GetReferencedAssemblies();

        references.Should().NotContain(
            a => a.Name == "ArchLucid.Notifications",
            because: "Application must dispatch alerts through orchestration ports, not reference the Notifications delivery assembly directly.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_references_Decisioning_by_design()
    {
        // AgentRuntime consumes decisioning models during agent execution (findings, alerts) before Application
        // orchestration ports fully absorb those edges. Pinning documents intentional coupling pending #55 port inversion.
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;
        AssemblyName[] references = agentRuntime.GetReferencedAssemblies();

        references.Should().Contain(
            a => a.Name == "ArchLucid.Decisioning",
            because: "AgentRuntime currently references Decisioning for in-process agent evaluation; refactor to Application ports is tracked under Improvement #55.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void AgentRuntime_references_Provenance_by_design()
    {
        // AgentRuntime builds provenance snapshots during execution; Provenance graph assembly is consumed in-process.
        // Pinning documents the lateral edge until IProvenanceProjection ports land (Improvement #55 Option A).
        Assembly agentRuntime = typeof(RealAgentExecutor).Assembly;
        AssemblyName[] references = agentRuntime.GetReferencedAssemblies();

        references.Should().Contain(
            a => a.Name == "ArchLucid.Provenance",
            because: "AgentRuntime currently references Provenance for run-time provenance assembly; port inversion is tracked under Improvement #55.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Decisioning_must_not_reference_Notifications_assembly()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Decisioning", "ArchLucid.Decisioning.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.Notifications",
            because: "Decisioning must not depend on notification infrastructure (TB-029); webhook channels live in ArchLucid.Notifications.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Provenance_csproj_references_ArtifactSynthesis_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Provenance", "ArchLucid.Provenance.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.ArtifactSynthesis",
            because: "ProvenanceBuilder ingests synthesized artifact models directly; projection ports are tracked under Improvement #55.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Provenance_csproj_references_Decisioning_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Provenance", "ArchLucid.Provenance.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.Decisioning",
            because: "Provenance graphs include decision traces from Decisioning today; event-driven projection is tracked under Improvement #55.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Provenance_csproj_references_KnowledgeGraph_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Provenance", "ArchLucid.Provenance.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.KnowledgeGraph",
            because: "ProvenanceBuilder embeds graph snapshot nodes from KnowledgeGraph; port-based projection is tracked under Improvement #55.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Retrieval_csproj_references_Decisioning_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Retrieval", "ArchLucid.Retrieval.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.Decisioning",
            because: "Retrieval adapters consume Decisioning types in-process today; Contracts port inversion is tracked under Improvement #55 Option B.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Retrieval_csproj_references_ArtifactSynthesis_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Retrieval", "ArchLucid.Retrieval.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.ArtifactSynthesis",
            because: "Retrieval chunking reads synthesized artifact models directly; shared Contracts types are tracked under Improvement #55 Option B.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Retrieval_csproj_references_Provenance_by_design()
    {
        string? root = FindRepositoryRootContainingSolution();
        root.Should().NotBeNull(because: "ArchLucid.sln must be discoverable from the test output directory.");

        string csprojPath = Path.Combine(root!, "ArchLucid.Retrieval", "ArchLucid.Retrieval.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().Contain(
            "ArchLucid.Provenance",
            because: "Retrieval indexing references provenance graph assembly today; event-driven projection is tracked under Improvement #55 Option B.");
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Capabilities_Cost_must_not_depend_on_Persistence()
    {
        Assembly capabilitiesCost = typeof(ArchLucid.Capabilities.Cost.CostAgentHandler).Assembly;

        TestResult result = Types
            .InAssembly(capabilitiesCost)
            .ShouldNot()
            .HaveDependencyOn("ArchLucid.Persistence")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Capabilities.Cost is domain-tier logic and must not reference ArchLucid.Persistence (INV hexagonal tier-3 guard). Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void BackfillCli_references_Persistence_by_design()
    {
        // One-time SqlRelationalBackfill migration host composes Persistence.Coordination.Backfill directly.
        Assembly backfillCli = typeof(BackfillCliAssemblyAnchor).Assembly;
        AssemblyName[] references = backfillCli.GetReferencedAssemblies();

        references.Should().Contain(
            a => a.Name == "ArchLucid.Persistence",
            because: "Backfill.Cli is a deliberate maintenance host over Persistence adapters; see docs/library/SqlRelationalBackfill.md.");
    }

    private static HashSet<string> CollectTransitiveFirstPartyAssemblyReferences(Assembly assembly)
    {
        HashSet<string> seen = new(StringComparer.Ordinal);
        Queue<AssemblyName> pending = new();

        foreach (AssemblyName reference in assembly.GetReferencedAssemblies())
        {
            if (reference.Name is not null && reference.Name.StartsWith("ArchLucid.", StringComparison.Ordinal))
            {
                pending.Enqueue(reference);
            }
        }

        while (pending.Count > 0)
        {
            AssemblyName reference = pending.Dequeue();

            if (reference.Name is null || !seen.Add(reference.Name))
            {
                continue;
            }

            Assembly loaded = Assembly.Load(reference);

            foreach (AssemblyName nested in loaded.GetReferencedAssemblies())
            {
                if (nested.Name is not null && nested.Name.StartsWith("ArchLucid.", StringComparison.Ordinal))
                {
                    pending.Enqueue(nested);
                }
            }
        }

        return seen;
    }

    private static IEnumerable<string> ReadProjectReferenceAssemblyNames(string csprojPath)
    {
        Regex projectReferenceInclude = new(
            "<ProjectReference\\s+Include=\"([^\"]+)\"",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

        string text = File.ReadAllText(csprojPath);
        MatchCollection matches = projectReferenceInclude.Matches(text);

        foreach (Match match in matches)
        {
            if (!match.Success)
            {
                continue;
            }

            string includePath = match.Groups[1].Value.Replace('\\', '/');
            string folderName = Path.GetFileName(Path.GetDirectoryName(includePath.TrimEnd('/')) ?? includePath);

            if (!string.IsNullOrWhiteSpace(folderName))
            {
                yield return folderName;
            }
        }
    }

    private static string? FindRepositoryRootContainingSolution()
    {
        string? dir = Path.GetDirectoryName(typeof(DependencyConstraintTests).Assembly.Location);

        for (int i = 0; i < TestRepositoryPathLimits.MaxStepsFromTestAssemblyBinToSolutionFile && dir is not null; i++)
        {
            if (File.Exists(Path.Combine(dir, "ArchLucid.sln")))
            {
                return dir;
            }

            dir = Directory.GetParent(dir)?.FullName;
        }

        return null;
    }

    private static bool IsExcludedSourceScanPath(string fullPath)
    {
        string n = fullPath.Replace('\\', '/');

        return n.Contains("/bin/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/obj/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/.git/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("Tests/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAuthorizedDirectIntegrationPublishFile(string fullPath)
    {
        string file = Path.GetFileName(fullPath);

        return file.Equals("IntegrationEventPublishing.cs", StringComparison.OrdinalIgnoreCase)
            || file.Equals("IntegrationEventOutboxProcessor.cs", StringComparison.OrdinalIgnoreCase);
    }

    private static string FormatFailingTypeNames(TestResult result)
    {
        IReadOnlyList<string>? names = result.FailingTypeNames;

        if (names is null || names.Count == 0)
        {
            return "(none reported)";
        }

        return string.Join(", ", names);
    }
}
