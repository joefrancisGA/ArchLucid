using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using BenchmarkDotNet.Attributes;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Benchmarks;

/// <summary>CPU-only merge path (schema validation + manifest merge); no SQL or agents.</summary>
[MemoryDiagnoser]
public class DecisionEngineMergeBenchmarks
{
    private DecisionEngineService _service = null!;
    private ArchitectureRequest _request = null!;
    private AgentResult[] _results = [];

    [GlobalSetup]
    public void Setup()
    {
        SchemaValidationService validationService = new(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        _service = new DecisionEngineService(validationService);

        _request = new ArchitectureRequest
        {
            RequestId = "REQ-BENCH",
            SystemName = "BenchSystem",
            Description = "Synthetic request for merge throughput measurement."
        };

        AgentResult topology = new()
        {
            ResultId = "RES-1",
            TaskId = "TASK-1",
            RunId = "RUN-BENCH",
            AgentType = AgentType.Topology,
            Claims = ["Add API service"],
            EvidenceRefs = ["request"],
            Confidence = 0.90,
            ProposedChanges = new ManifestDeltaProposal
            {
                ProposalId = "PROP-1",
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-1",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        AgentResult compliance = new()
        {
            ResultId = "RES-2",
            TaskId = "TASK-2",
            RunId = "RUN-BENCH",
            AgentType = AgentType.Compliance,
            Claims = ["Managed Identity required"],
            EvidenceRefs = ["policy-pack"],
            Confidence = 0.95,
            ProposedChanges = new ManifestDeltaProposal
            {
                ProposalId = "PROP-2",
                SourceAgent = AgentType.Compliance,
                RequiredControls = ["Managed Identity"]
            }
        };

        _results = [topology, compliance];
    }

    [Benchmark(Baseline = true)]
    public bool MergeTwoAgentResults()
    {
        DecisionMergeResult result = _service.MergeResults(
            "RUN-BENCH",
            _request,
            "v1",
            _results,
            evaluations: [],
            decisionNodes: [],
            parentManifestVersion: null);

        return result.Success;
    }
}
