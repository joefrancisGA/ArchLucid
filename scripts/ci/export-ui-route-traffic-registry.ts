import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { UI_ROUTE_TRAFFIC_ROWS } from "../../archlucid-ui/src/lib/ui-route-traffic/registry";

const outputPath = resolve(process.argv[2] ?? "registry-rows.json");

const payload = UI_ROUTE_TRAFFIC_ROWS.map((row) => ({
  rowId: row.rowId,
  path: row.path,
  section: row.section,
  note: row.note,
}));

writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");

console.log(`Wrote ${payload.length} registry rows to ${outputPath}`);
