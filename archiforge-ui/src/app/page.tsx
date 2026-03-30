import Link from "next/link";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";

export default function HomePage() {
  return (
    <main>
      <h2>Operator Shell</h2>
      <p>
        List runs, open run detail (manifest summary + artifacts), compare runs, replay authority
        chain, and download bundles or run exports.
      </p>

      <OperatorEmptyState title="No live data on this page">
        <p style={{ margin: 0 }}>
          This landing view is static. Loading, empty, and error states appear on Runs, run detail,
          manifest, graph, compare, and replay after you navigate there.
        </p>
      </OperatorEmptyState>

      <div style={{ marginTop: 24 }}>
        <p>Quick links:</p>
        <ul>
          <li>
            <Link href="/runs?projectId=default">Runs</Link>
          </li>
          <li>
            <Link href="/compare">Compare Runs</Link>
          </li>
          <li>
            <Link href="/replay">Replay Run</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
