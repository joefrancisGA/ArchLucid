# 34. Agent-task / simulator matrix

Authority-complete runs must not be driven with `execute`/`result`. Legacy coordinator expects four `AgentResult` types (topology, cost, compliance, critic) before finalize. Executor may be simulator or real Azure OpenAI.

![Agent task simulator matrix](../architecture_diagrams/archlucid-agent-task-simulator-matrix.svg)

See `AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md` (TB-1007).
