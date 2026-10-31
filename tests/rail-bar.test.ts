import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../src/config.js";
import { EMPTY_RUN_ACTIVITY } from "../src/run-activity.js";
import { buildSidebarSnapshot } from "../src/sidebar.js";
import { createInertAtelierState } from "../src/state.js";
import { createRailBar, hitTestRail, railBarLines } from "../src/rail-bar.js";
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

	it("hit-tests only section title columns in rendered rows", () => {
		const lines = railBarLines(snapshot, config, theme, 145, 40, {});
		for (const id of ["agent", "tools"] as const) {
			const row = lines.findIndex((line) => line.includes(id.toUpperCase()));
			const title = lines[row]!.indexOf(id.toUpperCase());
			expect(hitTestRail(lines, row, title)).toBe(id);
		}
		const separator = lines[0]!.indexOf("  ·  ") + 2;
		expect(hitTestRail(lines, 0, separator)).toBeUndefined();
		expect(hitTestRail(lines, 0, lines[0]!.indexOf("AGENT") + "AGENT".length)).toBeUndefined();
		expect(hitTestRail(lines, 0, visibleWidth(lines[0]!))).toBeUndefined();
		expect(hitTestRail(lines, 1, 2)).toBeUndefined();
	});

	it("toggles a title once on click, not on press or release", () => {
		let expanded = true;
		const onSectionClick = vi.fn((id: string) => {
			expect(id).toBe("agent");
			expanded = !expanded;
		});
		const bar = createRailBar(() => ["▾ AGENT model"], onSectionClick);
		bar.render(120);
		const event = (type: "press" | "release" | "click" | "wheel") => ({
			type,
			button: "left" as const,
			x: 2,
			y: 0,
			screenX: 2,
			screenY: 0,
			width: 120,
			height: 1,
			shift: false,
			alt: false,
			ctrl: false,
		});
		bar.handleMouse?.(event("press"));
		bar.handleMouse?.(event("release"));
		expect(onSectionClick).not.toHaveBeenCalled();
		bar.handleMouse?.(event("click"));
		expect(onSectionClick).toHaveBeenCalledOnce();
		expect(expanded).toBe(false);
		bar.handleMouse?.(event("wheel"));
		expect(onSectionClick).toHaveBeenCalledOnce();
	});

	it("has no hit area when the rail is gated off", () => {
		expect(hitTestRail(railBarLines(snapshot, config, theme, 63, 40, {}), 0, 0)).toBeUndefined();
		expect(hitTestRail(railBarLines(snapshot, config, theme, 120, 19, {}), 0, 0)).toBeUndefined();
	});

	it("returns no rows below either minimum and renders up to the configured cap above it", () => {
		expect(railBarLines(snapshot, config, theme, 63, 40, {})).toEqual([]);
		expect(railBarLines(snapshot, config, theme, 145, 19, {})).toEqual([]);
		expect(railBarLines(snapshot, config, theme, 145, 40, {})).toHaveLength(4);
		expect(railBarLines(snapshot, config, theme, 145, 23, {})).toHaveLength(1);
	});
});
