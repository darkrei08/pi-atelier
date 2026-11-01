import type { Component, OverlayHandle } from "@earendil-works/pi-tui";

// Upstream supports Pi 0.84, while rail clicks need the newer MouseRegion API.
export interface CompatMouseEvent {
	type: string;
	button: string;
	x: number;
	y: number;
}

export type MouseRegionComponent = Component & {
	handleMouse?(event: CompatMouseEvent): unknown;
};

type MouseRegionConstructor = new (
	component: Component,
	handler: (event: CompatMouseEvent) => unknown,
) => MouseRegionComponent;

type MouseRegionModule = { MouseRegion?: MouseRegionConstructor };

export function createMouseRegionComponent(
	hostModule: unknown,
	component: Component,
	handler: (event: CompatMouseEvent) => unknown,
): MouseRegionComponent {
	const MouseRegion = (hostModule as MouseRegionModule | null | undefined)?.MouseRegion;
	if (!MouseRegion) return component;
	return new MouseRegion(component, handler);
}

export function overlayHandleBounds<T extends OverlayHandle & { getBounds?: () => unknown }>(
	handle: T,
): ReturnType<NonNullable<T["getBounds"]>> | undefined {
	const getBounds = handle.getBounds as NonNullable<T["getBounds"]> | undefined;
	if (typeof getBounds !== "function") return undefined;
	return getBounds.call(handle) as ReturnType<NonNullable<T["getBounds"]>>;
}
