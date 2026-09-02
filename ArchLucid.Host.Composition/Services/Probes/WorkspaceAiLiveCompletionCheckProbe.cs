using ArchLucid.Contracts.Diagnostics;
namespace ArchLucid.Host.Composition.Services.Probes;
public static class WorkspaceAiLiveCompletionCheckProbe {
  public static void AppendProbeMetadata(Dictionary<string,string> debug, WorkspaceAiLiveCompletionProbeResult liveProbe){
    ArgumentNullException.ThrowIfNull(debug);ArgumentNullException.ThrowIfNull(liveProbe);
    if(!string.IsNullOrWhiteSpace(liveProbe.DeploymentName))debug["probeDeploymentName"]=liveProbe.DeploymentName;
    if(!string.IsNullOrWhiteSpace(liveProbe.ModelId))debug["probeModelId"]=liveProbe.ModelId;
  }
}
