/** Fire-and-forget POST checklist step telemetry (`POST /v1/diagnostics/core-pilot-rail-step`). */


function postRailStep(stepIndex: number): void {
  try {
    if (typeof fetch !== "undefined") {


      void fetch("/api/proxy/v1/diagnostics/core-pilot-rail-step", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ stepIndex }),

        keepalive: true,
      });
    }
  } catch {


    /* ignore */
  }


}


/** Records checklist progress (indices align with CORE_PILOT_STEPS ordering). */


export function recordCorePilotRailChecklistStep(stepIndex: number): void {
  const n = Number.isFinite(stepIndex) ? Math.trunc(stepIndex) : NaN;


  if (n < 0 || n > 3) {


    return;
  }



  postRailStep(n);
}
