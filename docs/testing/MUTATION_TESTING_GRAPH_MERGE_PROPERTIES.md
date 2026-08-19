# Graph merge property mutation testing (Prompt 11)

Target: `AgentTopologyProposalGraphMerge.cs`, `AgentTopologyProposalMergeGate.cs`, `TopologyProposalRelationshipEndpointIndex.cs`.

Run:

```powershell
dotnet dotnet-stryker -f stryker-config.application-graph-merge-properties.json
```

First baseline is intentionally low (15% break). Surviving mutants to fix in follow-up:

- Endpoint alias merge order mutants (Topology before Cost).
- `DropDanglingEdges` removal mutants.
- `ProposedChanges` sentinel indexing mutants.

Do not include `AgentTopologyProposalGraphMergeTests.cs` (3k+ example suite).
