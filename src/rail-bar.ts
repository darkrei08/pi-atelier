import { MouseRegion, type TuiMouseEvent, visibleWidth } from "@earendil-works/pi-tui";
import type { Component } from "@earendil-works/pi-tui";
import { renderHeaderRail } from "./header-rail.js";
import { railCardAt, railStripLines } from "./rail-strip.js";
import type { ThemeLike } from "./palette.js";
import type { SectionExpansion } from "./rail-sections.js";
import { sanitizeInline } from "./text.js";
import type { SidebarSnapshot } from "./sidebar.js";
import type { AtelierConfig, BuiltinSidebarPanelId } from "./types.js";

export const RAIL_BAR_MIN_WIDTH = 64;
export const RAIL_BAR_MIN_ROWS = 20;

export function railBarLines(
	snapshot: SidebarSnapshot,
	config: AtelierConfig,
	theme: ThemeLike,
	width: number,
	rows: number,
	expansion: SectionExpansion,
): string[] {
	if (width < RAIL_BAR_MIN_WIDTH || rows < RAIL_BAR_MIN_ROWS) return [];
	if (config.panelPlacement === "top") return railStripLines(snapshot, config, theme, width, rows, expansion);
	const maxRows = rows < 24 ? 1 : Math.min(4, config.headerRailRows);
	return renderHeaderRail(snapshot, { ...config, headerRailRows: maxRows }, theme, width, expansion).filter(
		Boolean,
	);
}

const SECTION_TITLE =
	/(▾|▸|\[-\]|\[\+\]) (AGENT|ACTIVITY|ALERTS|TODOS|CONTEXT|WORKSPACE|USAGE|SUBAGENTS|TOOLS)\b/g;

export function hitTestRail(
	rows: readonly string[],
	row: number,
	column: number,
): BuiltinSidebarPanelId | undefined {
	if (!Number.isInteger(row) || !Number.isInteger(column) || column < 0) return undefined;
	const card = railCardAt(rows, row, column);
	if (card) return card;
	const line = rows[row];
	if (!line) return undefined;
	const text = sanitizeInline(line);
	for (const match of text.matchAll(SECTION_TITLE)) {
		const start = visibleWidth(text.slice(0, match.index));
		const end = start + visibleWidth(match[0]);
		if (column >= start && column < end) return match[2]!.toLowerCase() as BuiltinSidebarPanelId;
	}
	return undefined;
}

export type RailBarComponent = Component & {
	setRows(rows: number): void;
};

export function createRailBar(
	render: (width: number, rows: number) => string[],
	onSectionClick?: (id: BuiltinSidebarPanelId) => void,
): RailBarComponent {
	let rows = 0;
	let renderedLines: string[] = [];
	const child: Component = {
		render(width) {
			renderedLines = render(width, rows);
			return renderedLines;
		},
		invalidate() {},
	};
	const region = new MouseRegion(child, (event: TuiMouseEvent) => {
		if (event.button !== "left" || !["press", "release", "click"].includes(event.type)) return undefined;
		const id = hitTestRail(renderedLines, event.y, event.x);
		if (!id) return undefined;
		if (event.type === "click") onSectionClick?.(id);
		return { handled: true };
	});
	return {
		render(width) {
			return region.render(width);
		},
		handleMouse(event) {
			return region.handleMouse(event);
		},
		setRows(nextRows) {
			rows = nextRows;
		},
		invalidate() {
			region.invalidate();
		},
	};
}
