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
///     Comparison, drift, and replay-diagnostics payload shapes deserialized from the API.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    public sealed class ComparisonSummary
    {
        public string ComparisonRecordId
        {
            get;
            set;
        } = string.Empty;

        public string ComparisonType
        {
            get;
            set;
        } = string.Empty;

        public string Format
        {
            get;
            set;
        } = string.Empty;

        public string Summary
        {
            get;
            set;
        } = string.Empty;
    }

    public sealed class DriftItem
    {
        public string Category
        {
            get;
            set;
        } = string.Empty;

        public string Path
        {
            get;
            set;
        } = string.Empty;

        public string? Description
        {
            get;
            set;
        }
    }

    public sealed class DriftAnalysis
    {
        public bool DriftDetected
        {
            get;
            set;
        }

        public string Summary
        {
            get;
            set;
        } = string.Empty;

        public List<DriftItem> Items
        {
            get;
            set;
        } = [];
    }

    public sealed class ReplayDiagnostics
    {
        public List<ReplayDiagnosticsEntry> RecentReplays
        {
            get;
            set;
        } = [];
    }

    public sealed class ReplayDiagnosticsEntry
    {
        public DateTime TimestampUtc
        {
            get;
            set;
        }

        public string ComparisonRecordId
        {
            get;
            set;
        } = string.Empty;

        public string ComparisonType
        {
            get;
            set;
        } = string.Empty;

        public string Format
        {
            get;
            set;
        } = string.Empty;

        public string ReplayMode
        {
            get;
            set;
        } = string.Empty;

        public long DurationMs
        {
            get;
            set;
        }

        public bool Success
        {
            get;
            set;
        }

        public bool MetadataOnly
        {
            get;
            set;
        }

        public string? PersistedReplayRecordId
        {
            get;
            set;
        }

        public string? ErrorMessage
        {
            get;
            set;
        }
    }

    public sealed class ComparisonHistoryResult
    {
        public List<ComparisonRecordSummary> Records
        {
            get;
            set;
        } = [];

        public string? NextCursor
        {
            get;
            set;
        }
    }

    public sealed class ComparisonRecordSummary
    {
        public string ComparisonRecordId
        {
            get;
            set;
        } = string.Empty;

        public string ComparisonType
        {
            get;
            set;
        } = string.Empty;

        public string? LeftRunId
        {
            get;
            set;
        }

        public string? RightRunId
        {
            get;
            set;
        }

        public string? LeftExportRecordId
        {
            get;
            set;
        }

        public string? RightExportRecordId
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public string? Label
        {
            get;
            set;
        }

        public List<string> Tags
        {
            get;
            set;
        } = [];
    }
}
