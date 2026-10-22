namespace ArchLucid.Contracts.Operations;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>Unified long-running operation lifecycle for poll endpoints (TB-2074).</summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<OperationState>))]
public enum OperationState
{
  Pending = 0,
  Running = 1,
  Succeeded = 2,
  Failed = 3,
  Canceled = 4,
  CancelRequested = 5
}
