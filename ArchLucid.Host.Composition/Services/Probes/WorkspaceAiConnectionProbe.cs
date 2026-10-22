using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Configuration;
namespace ArchLucid.Host.Composition.Services.Probes;
public static class WorkspaceAiConnectionProbe {
  public static WorkspaceAiAvailabilityCheckRow BuildManagedConfigurationCheckRow(bool configured) => new(){Name="azure_openai_configuration",Status=configured?"ok":"failed",Detail=configured?"Azure OpenAI endpoint and deployment are configured for Real agent execution.":AgentExecutionReadinessMessages.LiveCompletionUnavailable};
  public static WorkspaceAiAvailabilityCheckRow BuildMissingRecordCheckRow() => new(){Name="customer_connection_record",Status="failed",Detail="Customer-provided AI connection policy is enabled but no connection row exists."};
  public static WorkspaceAiAvailabilityCheckRow BuildDisabledRecordCheckRow() => new(){Name="customer_connection_record",Status="failed",Detail="Customer-provided AI connection exists but is disabled."};
  public static WorkspaceAiAvailabilityCheckRow BuildMissingApiKeyCheckRow() => new(){Name="customer_connection_live_probe",Status="failed",Detail="API key secret is missing or empty."};
  public static void AppendConnectionDebugMetadata(Dictionary<string,string> debug, TenantAzureOpenAiConnectionRecord row){ArgumentNullException.ThrowIfNull(debug);ArgumentNullException.ThrowIfNull(row);debug["customerConnectionEnabled"]=row.IsEnabled.ToString();if(!string.IsNullOrWhiteSpace(row.Endpoint))debug["customerConnectionEndpointHost"]=TryHost(row.Endpoint);}
  public static WorkspaceAiAvailabilityCheckRow BuildCustomerLiveProbeCheckRow(WorkspaceAiLiveCompletionProbeResult liveProbe)=>new(){Name="customer_connection_live_probe",Status=liveProbe.Succeeded?"ok":"failed",Detail=liveProbe.Detail};
  public static WorkspaceAiAvailabilityCheckRow BuildManagedLiveProbeCheckRow(bool configured,bool ok,string detail)=>new(){Name="azure_openai_live_completion_probe",Status=!configured?"skipped":ok?"ok":"failed",Detail=detail};
  private static string TryHost(string endpoint)=>Uri.TryCreate(endpoint.Trim(),UriKind.Absolute,out Uri? uri)?uri.Host:"(invalid-uri)";
}
