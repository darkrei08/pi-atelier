import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config.js";
import { EMPTY_RUN_ACTIVITY } from "../src/run-activity.js";
import { buildSidebarSnapshot } from "../src/sidebar.js";
import { createInertAtelierState } from "../src/state.js";
import { railBarLines } from "../src/rail-bar.js";
import type { ThemeLike } from "../src/palette.js";

const theme: ThemeLike = { fg: (_role, text) => text, bold: (text) => text };
const snapshot = buildSidebarSnapshot({
	state: {
		...createInertAtelierState(null),
		activity: "working",
		modelId: "gpt-5.6-sol",
		thinkingLevel: "medium",
		branch: "feature/surface-model",
	},
	cwd: "/tmp/project",
	branchEntryCount: 38,
	activeToolCount: 8,
	availableToolCount: 12,
	runActivity: { ...EMPTY_RUN_ACTIVITY, phase: "running" },
});
const config = { ...DEFAULT_CONFIG, panelPlacement: "top" as const, headerRailRows: 4 };

const gates = [
	{ rows: 2, maxLines: 0 },
	{ rows: 4, maxLines: 0 },
	{ rows: 19, maxLines: 0 },
	{ rows: 20, maxLines: 1 },
	{ rows: 23, maxLines: 1 },
	{ rows: 24, maxLines: 4 },
	{ rows: 40, maxLines: 4 },
];

describe("fixed rail bar gates", () => {
	it.each(gates)(
		"limits output to $maxLines lines at $rows rows across supported widths",
		({ rows, maxLines }) => {
			for (const width of [40, 64, 76, 145]) {
				const lines = railBarLines(snapshot, config, theme, width, rows, {});
				expect(lines.length).toBeLessThanOrEqual(width < 64 ? 0 : maxLines);
				expect(lines.every((line) => line.length > 0)).toBe(true);
				expect(lines.every((line) => visibleWidth(line) <= width)).toBe(true);
			}
		},
	);

	it("returns no rows below either minimum and renders up to the configured cap above it", () => {
		expect(railBarLines(snapshot, config, theme, 63, 40, {})).toEqual([]);
		expect(railBarLines(snapshot, config, theme, 145, 19, {})).toEqual([]);
		expect(railBarLines(snapshot, config, theme, 145, 40, {})).toHaveLength(1);
		expect(railBarLines(snapshot, config, theme, 145, 23, {})).toHaveLength(1);
	});
});
