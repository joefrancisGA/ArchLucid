## ArchLucid.Application

Application-layer services used by `ArchLucid.Api`.

- Orchestrates:
  - architecture analysis reports
  - Markdown/HTML/DOCX/PDF exports
  - end-to-end run comparison and export
  - export-record diff comparison and export
  - comparison replay and drift analysis

When adding new behavior:

- Put orchestration and formatting logic here (not in controllers).
- Keep repositories/data access in `ArchLucid.Persistence.Data.*`.
- Keep manifest merge logic in `ArchLucid.Decisioning.Merge` (types such as `IDecisionEngineService` / `DecisionEngineService`).

See:

- `docs/ARCHITECTURE_COMPONENTS.md` (Application section)
- `docs/COMPARISON_REPLAY.md`

