import type { ISeriesPrimitive, SeriesAttachedParameter } from 'lightweight-charts';

class RsiBandRenderer {
    _top = 0;
    _bottom = 0;
    _color = '';

    update(top: number, bottom: number, color: string) {
        this._top = top;
        this._bottom = bottom;
        this._color = color;
    }

    draw(target: any) {
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            ctx.fillStyle = this._color;
            // Extend to infinity left/right
            ctx.fillRect(0, this._top, scope.bitmapSize.width, this._bottom - this._top);
        });
    }
}

class RsiBandView {
    _renderer = new RsiBandRenderer();
    _series: any = null;
    _topPrice: number;
    _bottomPrice: number;
    _color: string;

    constructor(topPrice: number, bottomPrice: number, color: string) {
        this._topPrice = topPrice;
        this._bottomPrice = bottomPrice;
        this._color = color;
    }

    attached(param: SeriesAttachedParameter<any, any>) {
        this._series = param.series;
    }

    update() {
        if (!this._series) return;
        const top = this._series.priceToCoordinate(this._topPrice);
        const bottom = this._series.priceToCoordinate(this._bottomPrice);
        if (top !== null && bottom !== null) {
            this._renderer.update(top, bottom, this._color);
        }
    }

    renderer() {
        return this._renderer;
    }
    
    zOrder(): 'bottom' | 'normal' | 'top' {
        return 'bottom';
    }
}

export class RsiBackgroundPlugin implements ISeriesPrimitive<any> {
    _view: RsiBandView;
    _series: any = null;

    constructor(topPrice: number, bottomPrice: number, color: string) {
        this._view = new RsiBandView(topPrice, bottomPrice, color);
    }

    attached(param: SeriesAttachedParameter<any, any>) {
        this._series = param.series;
        this._view.attached(param);
    }

    detached() {
        this._series = null;
    }

    paneViews() {
        return [this._view];
    }
    
    updateAllViews() {
        this._view.update();
    }
}
