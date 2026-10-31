import type { Component } from "@earendil-works/pi-tui";
import { renderHeaderRail } from "./header-rail.js";
import type { ThemeLike } from "./palette.js";
import type { SectionExpansion } from "./rail-sections.js";
import type { SidebarSnapshot } from "./sidebar.js";
import type { AtelierConfig } from "./types.js";

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
	const lines = renderHeaderRail(snapshot, config, theme, width, expansion);
	const maxRows = rows < 24 ? 1 : config.headerRailRows;
	return lines.filter(Boolean).slice(0, maxRows);
}

export type RailBarComponent = Component & {
	setRows(rows: number): void;
};

export function createRailBar(render: (width: number, rows: number) => string[]): RailBarComponent {
	let rows = 0;
	return {
		render(width) {
			return render(width, rows);
		},
		setRows(nextRows) {
			rows = nextRows;
		},
		invalidate() {},
	};
}
