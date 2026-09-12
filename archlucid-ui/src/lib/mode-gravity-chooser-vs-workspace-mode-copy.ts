/** MG-005 — two controls, one story: workspace mode vs Career/Rehearsal door. */
export const MODE_GRAVITY_WORKSPACE_MODE_CONTROL_HEADING = "Workspace mode" as const;

export const MODE_GRAVITY_EXECUTE_DOOR_CONTROL_HEADING = "Record and Practice" as const;

export const MODE_GRAVITY_TWO_CONTROLS_STORY =
  "Workspace mode chooses Working vs Guided teaching. On Working, Record and Practice chooses execute gravity — the controls stay separate." as const;

export const MODE_GRAVITY_FORBIDDEN_MERGE_MARKERS = [
  /merge.*workspace.*door/i,
  /auto-switch.*guided.*working/i,
  /guided.*career door/i,
] as const;
