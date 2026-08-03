import type { ISeriesPrimitive } from 'lightweight-charts';

export class HighlightBand implements ISeriesPrimitive {
    constructor(top: any, bottom: any, color: any) {
        console.log(top, bottom, color);
    }
    update(): void {}
    attached(): void {}
    detached(): void {}
    paneViews(): readonly any[] {
        return [];
    }
}
