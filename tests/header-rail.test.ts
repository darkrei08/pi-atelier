import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config.js";
import { renderHeaderRail } from "../src/header-rail.js";
import { buildSidebarSnapshot } from "../src/sidebar.js";
import { EMPTY_RUN_ACTIVITY } from "../src/run-activity.js";
import { createInertAtelierState } from "../src/state.js";

const theme = { fg: (_role: string, text: string) => text, bold: (text: string) => text };
const snapshot = buildSidebarSnapshot({
	state: {
		...createInertAtelierState(null),
		activity: "working",
		modelId: "gpt-5.6-sol",
		thinkingLevel: "medium",
		branch: "feature/sidebar",
		metrics: {
			usageAvailable: true,
			costAvailable: true,
			input: 50_000,
			output: 1_900,
			cacheRead: 100_000,
			cacheWrite: 0,
			cost: 0.479,
			subscription: false,
			contextTokens: 32_400,
			contextWindow: 400_000,
			contextPercent: 8.1,
			autoCompact: null,
		},
	},
	cwd: "/tmp/project",
	branchEntryCount: 38,
	activeToolCount: 8,
	availableToolCount: 12,
	runActivity: { ...EMPTY_RUN_ACTIVITY, phase: "running" },
});

const render = (width: number, expansion = {}) =>
	renderHeaderRail(snapshot, DEFAULT_CONFIG, theme, width, expansion);

describe("top header rail", () => {
	it.each([1, 2, 3, 4])("caps output at the configured %i rows", (headerRailRows) => {
		const lines = renderHeaderRail(snapshot, { ...DEFAULT_CONFIG, headerRailRows }, theme, 120, {});
		expect(lines.length).toBeLessThanOrEqual(headerRailRows);
	});

	it("shows distinct expanded and collapsed markers", () => {
		expect(render(120)[0]).toContain("▾ AGENT");
		expect(render(120, { agent: false }).join("\n")).toContain("▸ AGENT");
	});

	it("uses text fallback markers without Nerd Font mode", () => {
		const plain = renderHeaderRail(snapshot, { ...DEFAULT_CONFIG, nerdFont: false }, theme, 120, {
			agent: false,
		});
		expect(plain.join("\n")).toContain("[+] AGENT");
	});

	it.each([20, 40, 80])("never exceeds %i columns", (width) => {
		const lines = render(width);
		expect(lines.length).toBeLessThanOrEqual(2);
		expect(lines.every((line) => visibleWidth(line) <= width)).toBe(true);
	});

	it("marks hidden sections when the row cap prevents rendering them", () => {
		expect(render(40).at(-1)).toMatch(/… \+\d+$/);
	});

	it("returns no rows for an empty snapshot", () => {
		const empty = buildSidebarSnapshot({
			state: createInertAtelierState(null),
			cwd: "/tmp/project",
			branchEntryCount: 0,
			activeToolCount: 0,
			availableToolCount: 0,
		});
		expect(renderHeaderRail(empty, DEFAULT_CONFIG, theme, 120, {})).toEqual([]);
	});

	it("renders the standard snapshot as a stable 120-column rail", () => {
		expect(render(120)).toEqual([
			"▾ AGENT gpt-5.6-sol · medium  ·  ▾ ACTIVITY running  ·  ▾ CONTEXT 8% · 32k/400k  ·  ▾ USAGE 50k/1.9k/100k",
			"▾ TOOLS 8/12",
		]);
	});

	it("hides summaries for collapsed sections and marks focus only when requested", () => {
		const collapsed = renderHeaderRail(snapshot, DEFAULT_CONFIG, theme, 120, { agent: false });
		expect(collapsed.join("\n")).toContain("▸ AGENT");
		expect(collapsed.join("\n")).not.toContain("gpt-5.6-sol");
		const focused = renderHeaderRail(snapshot, DEFAULT_CONFIG, theme, 120, {}, "agent");
		expect(focused.join("\n")).toContain("<▾ AGENT gpt-5.6-sol · medium>");
	});
});
