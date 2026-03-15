using ArchiForge.Api.Services;
using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Manifest;
using ArchiForge.Contracts.Metadata;
using ArchiForge.Contracts.Requests;
using ArchiForge.Coordinator.Services;
using ArchiForge.Data.Repositories;
using ArchiForge.DecisionEngine.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ArchiForge.Api.Tests;

public sealed class ArchitectureApplicationServiceTests
{
    private readonly Mock<ICoordinatorService> _coordinator;
    private readonly Mock<IDecisionEngineService> _decisionEngine;
    private readonly Mock<IArchitectureRunRepository> _runRepository;
    private readonly Mock<IAgentTaskRepository> _taskRepository;
    private readonly Mock<IAgentResultRepository> _resultRepository;
    private readonly Mock<IGoldenManifestRepository> _manifestRepository;
    private readonly Mock<IEvidenceBundleRepository> _evidenceBundleRepository;
    private readonly Mock<IDecisionTraceRepository> _decisionTraceRepository;
    private readonly Mock<IArchitectureRequestRepository> _requestRepository;
    private readonly Mock<ILogger<ArchitectureApplicationService>> _logger;
    private readonly ArchitectureApplicationService _sut;

    public ArchitectureApplicationServiceTests()
    {
        _coordinator = new Mock<ICoordinatorService>();
        _decisionEngine = new Mock<IDecisionEngineService>();
        _runRepository = new Mock<IArchitectureRunRepository>();
        _taskRepository = new Mock<IAgentTaskRepository>();
        _resultRepository = new Mock<IAgentResultRepository>();
        _manifestRepository = new Mock<IGoldenManifestRepository>();
        _evidenceBundleRepository = new Mock<IEvidenceBundleRepository>();
        _decisionTraceRepository = new Mock<IDecisionTraceRepository>();
        _requestRepository = new Mock<IArchitectureRequestRepository>();
        _logger = new Mock<ILogger<ArchitectureApplicationService>>();

        _sut = new ArchitectureApplicationService(
            _coordinator.Object,
            _decisionEngine.Object,
            _runRepository.Object,
            _taskRepository.Object,
            _resultRepository.Object,
            _manifestRepository.Object,
            _evidenceBundleRepository.Object,
            _decisionTraceRepository.Object,
            _requestRepository.Object,
            _logger.Object);
    }

    private static ArchitectureRequest ValidRequest() => new()
    {
        RequestId = "req-1",
        Description = "A system for testing architecture",
        SystemName = "TestSystem",
        Environment = "prod",
        CloudProvider = CloudProvider.Azure
    };

    private static ArchitectureRun ValidRun(string runId = "run-1", string requestId = "req-1") => new()
    {
        RunId = runId,
        RequestId = requestId,
        Status = ArchitectureRunStatus.TasksGenerated,
        CreatedUtc = DateTime.UtcNow
    };

    private static AgentTask ValidTask(string runId = "run-1", AgentType type = AgentType.Topology) => new()
    {
        TaskId = "task-1",
        RunId = runId,
        AgentType = type,
        Objective = "Design topology",
        Status = AgentTaskStatus.Created
    };

    private static AgentResult ValidResult(string runId = "run-1", AgentType type = AgentType.Topology) => new()
    {
        ResultId = "result-1",
        TaskId = "task-1",
        RunId = runId,
        AgentType = type,
        Claims = ["Claim"],
        EvidenceRefs = [],
        Confidence = 0.9
    };

    #region CreateRunAsync

    [Fact]
    public async Task CreateRunAsync_WhenCoordinatorSucceeds_PersistsAndReturnsResponse()
    {
        var request = ValidRequest();
        var run = ValidRun("run-1", request.RequestId);
        var tasks = new List<AgentTask> { ValidTask("run-1") };
        var evidenceBundle = new EvidenceBundle { EvidenceBundleId = "eb-1" };
        var coordination = new CoordinationResult
        {
            Run = run,
            EvidenceBundle = evidenceBundle,
            Tasks = tasks,
            Errors = []
        };

        _coordinator.Setup(c => c.CreateRun(request)).Returns(coordination);
        _requestRepository.Setup(r => r.CreateAsync(request, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _runRepository.Setup(r => r.CreateAsync(run, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _evidenceBundleRepository.Setup(r => r.CreateAsync(evidenceBundle, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _taskRepository.Setup(r => r.CreateManyAsync(tasks, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.CreateRunAsync(request);

        result.Success.Should().BeTrue();
        result.Response.Should().NotBeNull();
        result.Response!.Run.RunId.Should().Be("run-1");
        result.Response.Tasks.Should().HaveCount(1);
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateRunAsync_WhenCoordinatorFails_ReturnsFailure()
    {
        var request = ValidRequest();
        var coordination = new CoordinationResult { Errors = ["Validation failed"] };

        _coordinator.Setup(c => c.CreateRun(request)).Returns(coordination);

        var result = await _sut.CreateRunAsync(request);

        result.Success.Should().BeFalse();
        result.Response.Should().BeNull();
        result.Errors.Should().Contain("Validation failed");
        _runRepository.Verify(r => r.CreateAsync(It.IsAny<ArchitectureRun>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region GetRunAsync

    [Fact]
    public async Task GetRunAsync_WhenRunExists_ReturnsRunWithTasksAndResults()
    {
        var run = ValidRun();
        var tasks = new List<AgentTask> { ValidTask() };
        var results = new List<AgentResult> { ValidResult() };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _taskRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(tasks);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(results);

        var result = await _sut.GetRunAsync("run-1");

        result.Should().NotBeNull();
        result!.Run.RunId.Should().Be("run-1");
        result.Tasks.Should().HaveCount(1);
        result.Results.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetRunAsync_WhenRunNotFound_ReturnsNull()
    {
        _runRepository.Setup(r => r.GetByIdAsync("nonexistent", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRun?)null);

        var result = await _sut.GetRunAsync("nonexistent");

        result.Should().BeNull();
    }

    #endregion

    #region SubmitAgentResultAsync

    [Fact]
    public async Task SubmitAgentResultAsync_WhenRunExists_StoresResultAndUpdatesStatus()
    {
        var run = ValidRun();
        var result = ValidResult("run-1");
        var resultsAfterSubmit = new List<AgentResult> { result };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _resultRepository.Setup(r => r.CreateAsync(result, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(resultsAfterSubmit);
        _runRepository.Setup(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.WaitingForResults, null, null, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sutResult = await _sut.SubmitAgentResultAsync("run-1", result);

        sutResult.Success.Should().BeTrue();
        sutResult.ResultId.Should().Be("result-1");
        sutResult.Error.Should().BeNull();
    }

    [Fact]
    public async Task SubmitAgentResultAsync_WhenThreeResults_TransitionsToReadyForCommit()
    {
        var run = ValidRun();
        var result = ValidResult("run-1", AgentType.Compliance);
        var resultsAfterSubmit = new List<AgentResult>
        {
            ValidResult("run-1", AgentType.Topology),
            ValidResult("run-1", AgentType.Cost),
            result
        };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _resultRepository.Setup(r => r.CreateAsync(result, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(resultsAfterSubmit);
        _runRepository.Setup(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.ReadyForCommit, null, null, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sutResult = await _sut.SubmitAgentResultAsync("run-1", result);

        sutResult.Success.Should().BeTrue();
        _runRepository.Verify(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.ReadyForCommit, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SubmitAgentResultAsync_WhenRunNotFound_ReturnsError()
    {
        _runRepository.Setup(r => r.GetByIdAsync("nonexistent", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRun?)null);
        var result = ValidResult("nonexistent");

        var sutResult = await _sut.SubmitAgentResultAsync("nonexistent", result);

        sutResult.Success.Should().BeFalse();
        sutResult.Error.Should().Contain("not found");
        _resultRepository.Verify(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SubmitAgentResultAsync_WhenRunIdMismatch_ReturnsError()
    {
        var run = ValidRun("run-1");
        var result = ValidResult("run-2");
        result.RunId = "run-2";

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);

        var sutResult = await _sut.SubmitAgentResultAsync("run-1", result);

        sutResult.Success.Should().BeFalse();
        sutResult.Error.Should().Contain("does not match");
        _resultRepository.Verify(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region CommitRunAsync

    [Fact]
    public async Task CommitRunAsync_WhenAllValid_CommitsAndReturnsManifest()
    {
        var run = ValidRun();
        var request = ValidRequest();
        var results = new List<AgentResult> { ValidResult(), ValidResult("run-1", AgentType.Cost), ValidResult("run-1", AgentType.Compliance) };
        var manifest = new GoldenManifest { RunId = "run-1", SystemName = "TestSystem", Metadata = new ManifestMetadata { ManifestVersion = "v1" } };
        var merge = new DecisionMergeResult { Manifest = manifest, DecisionTraces = [] };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(results);
        _decisionEngine.Setup(d => d.MergeResults("run-1", request, "v1", results, null)).Returns(merge);
        _manifestRepository.Setup(r => r.CreateAsync(manifest, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _decisionTraceRepository.Setup(r => r.CreateManyAsync(Array.Empty<DecisionTrace>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _runRepository.Setup(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.Committed, "v1", It.IsAny<DateTime?>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.CommitRunAsync("run-1");

        result.Success.Should().BeTrue();
        result.Response.Should().NotBeNull();
        result.Response!.Manifest.Metadata.ManifestVersion.Should().Be("v1");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task CommitRunAsync_WhenRunNotFound_ReturnsError()
    {
        _runRepository.Setup(r => r.GetByIdAsync("nonexistent", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRun?)null);

        var result = await _sut.CommitRunAsync("nonexistent");

        result.Success.Should().BeFalse();
        result.Response.Should().BeNull();
        result.Errors.Should().Contain("Run not found");
        _decisionEngine.Verify(d => d.MergeResults(It.IsAny<string>(), It.IsAny<ArchitectureRequest>(), It.IsAny<string>(), It.IsAny<IReadOnlyCollection<AgentResult>>(), It.IsAny<string?>()), Times.Never);
    }

    [Fact]
    public async Task CommitRunAsync_WhenRequestNotFound_ReturnsError()
    {
        var run = ValidRun();
        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRequest?)null);

        var result = await _sut.CommitRunAsync("run-1");

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("ArchitectureRequest") && e.Contains("not found"));
    }

    [Fact]
    public async Task CommitRunAsync_WhenNoResults_ReturnsError()
    {
        var run = ValidRun();
        var request = ValidRequest();
        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(new List<AgentResult>());

        var result = await _sut.CommitRunAsync("run-1");

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain("no agent results");
    }

    [Fact]
    public async Task CommitRunAsync_WhenMergeFails_UpdatesRunToFailed()
    {
        var run = ValidRun();
        var request = ValidRequest();
        var results = new List<AgentResult> { ValidResult() };
        var merge = new DecisionMergeResult { Errors = ["Merge failed"] };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(results);
        _decisionEngine.Setup(d => d.MergeResults("run-1", request, "v1", results, null)).Returns(merge);
        _runRepository.Setup(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.Failed, null, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.CommitRunAsync("run-1");

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain("Merge failed");
        _runRepository.Verify(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.Failed, null, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()), Times.Once);
        _manifestRepository.Verify(r => r.CreateAsync(It.IsAny<GoldenManifest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CommitRunAsync_WhenPriorManifestExists_IncrementsVersion()
    {
        var run = ValidRun();
        run.CurrentManifestVersion = "v1";
        var request = ValidRequest();
        var results = new List<AgentResult> { ValidResult(), ValidResult("run-1", AgentType.Cost), ValidResult("run-1", AgentType.Compliance) };
        var manifest = new GoldenManifest { RunId = "run-1", SystemName = "TestSystem", Metadata = new ManifestMetadata { ManifestVersion = "v2" } };
        var merge = new DecisionMergeResult { Manifest = manifest, DecisionTraces = [] };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _resultRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(results);
        _decisionEngine.Setup(d => d.MergeResults("run-1", request, "v2", results, "v1")).Returns(merge);
        _manifestRepository.Setup(r => r.CreateAsync(manifest, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _decisionTraceRepository.Setup(r => r.CreateManyAsync(Array.Empty<DecisionTrace>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _runRepository.Setup(r => r.UpdateStatusAsync(It.IsAny<string>(), It.IsAny<ArchitectureRunStatus>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.CommitRunAsync("run-1");

        result.Success.Should().BeTrue();
        _decisionEngine.Verify(d => d.MergeResults("run-1", request, "v2", results, "v1"), Times.Once);
    }

    #endregion

    #region GetManifestAsync

    [Fact]
    public async Task GetManifestAsync_WhenVersionExists_ReturnsManifest()
    {
        var manifest = new GoldenManifest { RunId = "run-1", SystemName = "TestSystem", Metadata = new ManifestMetadata { ManifestVersion = "v1" } };
        _manifestRepository.Setup(r => r.GetByVersionAsync("v1", It.IsAny<CancellationToken>())).ReturnsAsync(manifest);

        var result = await _sut.GetManifestAsync("v1");

        result.Should().NotBeNull();
        result!.Metadata.ManifestVersion.Should().Be("v1");
    }

    [Fact]
    public async Task GetManifestAsync_WhenVersionNotFound_ReturnsNull()
    {
        _manifestRepository.Setup(r => r.GetByVersionAsync("nonexistent", It.IsAny<CancellationToken>())).ReturnsAsync((GoldenManifest?)null);

        var result = await _sut.GetManifestAsync("nonexistent");

        result.Should().BeNull();
    }

    #endregion

    #region SeedFakeResultsAsync

    [Fact]
    public async Task SeedFakeResultsAsync_WhenValid_SeedsResultsAndUpdatesStatus()
    {
        var run = ValidRun();
        var request = ValidRequest();
        var tasks = new List<AgentTask> { ValidTask(), ValidTask("run-1", AgentType.Cost), ValidTask("run-1", AgentType.Compliance) };
        var fakeResults = new List<AgentResult> { ValidResult(), ValidResult("run-1", AgentType.Cost), ValidResult("run-1", AgentType.Compliance) };

        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _taskRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(tasks);
        _resultRepository.Setup(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _runRepository.Setup(r => r.UpdateStatusAsync("run-1", ArchitectureRunStatus.ReadyForCommit, null, null, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.SeedFakeResultsAsync("run-1");

        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.ResultCount.Should().Be(3);
        result.Error.Should().BeNull();
        _resultRepository.Verify(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    [Fact]
    public async Task SeedFakeResultsAsync_WhenRunNotFound_ReturnsError()
    {
        _runRepository.Setup(r => r.GetByIdAsync("nonexistent", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRun?)null);

        var result = await _sut.SeedFakeResultsAsync("nonexistent");

        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Error.Should().Contain("not found");
        _resultRepository.Verify(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SeedFakeResultsAsync_WhenRequestNotFound_ReturnsError()
    {
        var run = ValidRun();
        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRequest?)null);

        var result = await _sut.SeedFakeResultsAsync("run-1");

        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task SeedFakeResultsAsync_WhenNoTasks_ReturnsError()
    {
        var run = ValidRun();
        var request = ValidRequest();
        _runRepository.Setup(r => r.GetByIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(run);
        _requestRepository.Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        _taskRepository.Setup(r => r.GetByRunIdAsync("run-1", It.IsAny<CancellationToken>())).ReturnsAsync(new List<AgentTask>());

        var result = await _sut.SeedFakeResultsAsync("run-1");

        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Error.Should().Contain("No tasks");
    }

    #endregion
}
