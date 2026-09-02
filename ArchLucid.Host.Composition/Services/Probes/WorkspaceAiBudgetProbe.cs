using System.Globalization;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Diagnostics;
namespace ArchLucid.Host.Composition.Services.Probes;
public static class WorkspaceAiBudgetProbe {
  public static void AppendDebugMetadata(Dictionary<string,string> debug, LlmMonthlyTenantDollarBudgetStatusResult s) {
    ArgumentNullException.ThrowIfNull(debug); ArgumentNullException.ThrowIfNull(s);
    debug["monthlyBudgetMonitoringActive"]=s.MonthlyBudgetMonitoringActive.ToString();
    debug["blocksAdditionalLlmExecution"]=s.BlocksAdditionalLlmExecution.ToString();
    if(!string.IsNullOrWhiteSpace(s.UtcMonth)) debug["llmBudgetUtcMonth"]=s.UtcMonth;
    if(s.HardCapUtilizationFraction is not null) debug["llmBudgetUtilizationFraction"]=s.HardCapUtilizationFraction.Value.ToString(CultureInfo.InvariantCulture);
  }
  public static WorkspaceAiAvailabilityCheckRow BuildCheckRow(LlmMonthlyTenantDollarBudgetStatusResult s) => new(){
    Name="workspace_llm_budget", Status=s.BlocksAdditionalLlmExecution?"failed":"ok",
    Detail=s.BlocksAdditionalLlmExecution?"Workspace AI spend cap is exhausted for the current UTC month.":s.MonthlyBudgetMonitoringActive?"Workspace AI spend is within the configured monthly cap.":"Monthly LLM dollar budget monitoring is not active for this workspace."};
}
