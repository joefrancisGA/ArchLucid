using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Command-facing result records. Each carries the HTTP status and correlation id so CLI commands
///     can print actionable failures without inspecting exceptions.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    public sealed record CreateRunResult(
        bool Success,
        CreateRunResponse? Response,
        string? Error,
        int? StatusCode,
        string? CorrelationId = null)
    {
        public static CreateRunResult Ok(CreateRunResponse? r)
        {
            return new CreateRunResult(true, r, null, null);
        }

        public static CreateRunResult Fail(int? statusCode, string error, string? correlationId = null)
        {
            return new CreateRunResult(false, null, error, statusCode, correlationId);
        }
    }

    public sealed class CreateRunResponse
    {
        public RunInfo Run
        {
            get;
            set;
        } = new();

        public List<AgentTaskInfo> Tasks
        {
            get;
            set;
        } = [];
    }

    public sealed class RunInfo
    {
        public string RunId
        {
            get;
            set;
        } = "";

        public string RequestId
        {
            get;
            set;
        } = "";

        public ArchitectureRunStatus Status
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public DateTime? CompletedUtc
        {
            get;
            set;
        }

        public string? CurrentManifestVersion
        {
            get;
            set;
        }

        /// <summary>Persisted OpenTelemetry W3C trace id from run creation; null for older runs.</summary>
        public string? OtelTraceId
        {
            get;
            set;
        }

        /// <summary>When <see langword="true" />, real-mode execution used deterministic simulator output instead of the LLM.</summary>
        public bool? RealModeFellBackToSimulator
        {
            get;
            set;
        }

        /// <summary>INV-002 persisted structural execution mode.</summary>
        public StructuralExecutionMode? StructuralExecutionMode
        {
            get;
            set;
        }
    }

    public sealed class AgentTaskInfo
    {
        public string TaskId
        {
            get;
            set;
        } = "";

        public string RunId
        {
            get;
            set;
        } = "";

        public AgentType AgentType
        {
            get;
            set;
        }

        public string Objective
        {
            get;
            set;
        } = "";

        public AgentTaskStatus Status
        {
            get;
            set;
        }
    }

    private sealed class AuditEventIdPage
    {
        public List<AuditEventIdItem>? Items { get; init; }
    }

    private sealed class AuditEventIdItem
    {
        public string? EventId { get; init; }
    }

    public sealed class GetRunResult
    {
        public RunInfo Run
        {
            get;
            set;
        } = new();

        public List<AgentTaskInfo> Tasks
        {
            get;
            set;
        } = [];

        public List<object> Results
        {
            get;
            set;
        } = [];
    }

    public sealed record CommitRunResult(
        bool Success,
        CommitRunResponse? Response,
        string? Error,
        int? HttpStatusCode = null,
        string? CorrelationId = null);

    public sealed record ExecuteRunResult(
        bool Success,
        string? Error,
        int? HttpStatusCode = null,
        string? CorrelationId = null);

    public sealed record GoldenManifestFingerprintResult(
        bool Success,
        string? Sha256HexUpper,
        string? Error,
        int? HttpStatusCode = null);

    public sealed class CommitRunResponse
    {
        public ManifestInfo Manifest
        {
            get;
            set;
        } = new();

        public List<string> Warnings
        {
            get;
            set;
        } = [];
    }

    public sealed class ManifestInfo
    {
        public string RunId
        {
            get;
            set;
        } = "";

        public string SystemName
        {
            get;
            set;
        } = "";

        public ManifestMetadataInfo Metadata
        {
            get;
            set;
        } = new();
    }

    public sealed class ManifestMetadataInfo
    {
        public string ManifestVersion
        {
            get;
            set;
        } = "";
    }

    public sealed record SeedFakeResultsResult(
        bool Success,
        int ResultCount,
        string? Error,
        int? HttpStatusCode = null);

    public sealed class SeedFakeResultsResponse
    {
        public string Message
        {
            get;
            set;
        } = "";

        public string RunId
        {
            get;
            set;
        } = "";

        public int ResultCount
        {
            get;
            set;
        }
    }

    public sealed record SubmitResultResult(bool Success, string? ResultId, string? Error, int? HttpStatusCode = null);

    public sealed record DraftApiResult<T>(
        bool Success,
        T? Value,
        string? Error,
        int? HttpStatusCode = null,
        string? CorrelationId = null)
    {
        public static DraftApiResult<T> Ok(T value) => new(true, value, null);

        public static DraftApiResult<T> Fail(int? httpStatusCode, string? error, string? correlationId = null) =>
            new(false, default, error, httpStatusCode, correlationId);
    }

    public sealed class SubmitResultResponse
    {
        public string Message
        {
            get;
            set;
        } = "";

        public string RunId
        {
            get;
            set;
        } = "";

        public string ResultId
        {
            get;
            set;
        } = "";
    }
}
