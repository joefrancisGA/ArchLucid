# C4 model (Structurizr DSL)

**File:** [`workspace.dsl`](workspace.dsl)

**Purpose:** Machine-readable C4 views (system context + containers + **API component** breakdown) that stay aligned with [`docs/ARCHITECTURE_CONTAINERS.md`](../ARCHITECTURE_CONTAINERS.md) and [`docs/START_HERE.md`](../START_HERE.md). Open the **`ApiComponents`** view in Structurizr for the HTTP surface split inside the API container.

## Render locally

- **Structurizr Lite (Docker):** mount `docs/c4` and open the workspace in the browser (see [Structurizr — DSL](https://docs.structurizr.com/dsl)).
- **CLI:** `structurizr-cli validate -workspace docs/c4/workspace.dsl`

## Maintenance

When you add a new major deployable (e.g. a dedicated BFF), add a `container` under the `archlucid` software system and extend `views.container` with `include *` or explicit `include` lines.
