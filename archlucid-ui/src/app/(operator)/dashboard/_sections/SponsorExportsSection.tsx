import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Sponsor-ready quick links for executive reporting exports and ROI framing context.
 */
export function SponsorExportsSection() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sponsor exports</CardTitle>
        <CardDescription className="text-xs">
          Open executive-ready views used in sponsor updates and pilot value readouts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="m-0 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <Link
              href="/executive/scorecard"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Executive scorecard
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              Board-ready rollup of estimated savings and systemic issues.
            </p>
          </li>
          <li>
            <Link
              href="/value-report/pilot"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Pilot value report
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              Pilot-period narrative for sponsors evaluating ROI.
            </p>
          </li>
          <li>
            <Link
              href="/value-report/roi"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              ROI methodology help
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              How directional savings estimates are calculated.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
