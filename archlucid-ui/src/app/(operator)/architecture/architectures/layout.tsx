import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Draft list / create / detail load live registry + draft API data — do not statically 404 unknown ids. */
export default OperatorDataRouteLayout;
