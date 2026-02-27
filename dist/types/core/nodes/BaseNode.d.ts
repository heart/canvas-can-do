import { Container } from 'pixi.js';
import type { TextStyleFontWeight } from 'pixi.js';
export type NodeType = 'rectangle' | 'circle' | 'text' | 'line' | 'ellipse' | 'star' | 'image' | 'group' | 'frame';
export type PropertyType = 'string' | 'int' | 'float' | 'color' | 'boolean' | 'enum';
export type PropertyGroup = 'Meta' | 'Transform' | 'Appearance' | 'Geometry' | 'Text' | 'Line' | 'Image';
export interface NodePropertyDescriptor {
    name: string;
    key: string;
    type: PropertyType;
    value: string | number | boolean | null;
    options?: Array<string | number>;
    group?: PropertyGroup;
    desc?: string;
    min?: number;
    max?: number;
    step?: number;
}
export interface InspectableNode {
    id: string;
    type: NodeType;
    name: string;
    props: NodePropertyDescriptor[];
}
export type PropertiesChangedEvent = CustomEvent<{
    nodes: InspectableNode[];
}>;
export type SelectionChangedEvent = CustomEvent<{
    nodes: InspectableNode[];
    selectedIds: string[];
}>;
export interface Style {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: TextStyleFontWeight;
    fontStyle?: 'normal' | 'italic' | 'oblique';
}
export declare class BaseNode extends Container {
    readonly id: string;
    readonly type: NodeType;
    name: string;
    style: Style;
    locked: boolean;
    protected _width: number;
    protected _height: number;
    constructor(options: {
        id?: string;
        type: NodeType;
        name?: string;
        x?: number;
        y?: number;
        rotation?: number;
        scale?: number | {
            x: number;
            y: number;
        };
        style?: Style;
        visible?: boolean;
        locked?: boolean;
    });
    protected defaultNameForType(type: NodeType): string;
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    setPosition(x: number, y: number): this;
    setScale(sx: number, sy?: number): this;
    setRotation(rad: number): this;
    setPivot(x: number, y: number): this;
    translate(x: number, y: number): this;
    resetTransform(): this;
    clone(_offsetX?: number, _offsetY?: number): BaseNode;
    protected toColorString(color: string | number | undefined): string | null;
    getProps(): NodePropertyDescriptor[];
    getInspectable(): InspectableNode;
}
declare global {
    interface WindowEventMap {
        'properties:changed': PropertiesChangedEvent;
        'selection:changed': SelectionChangedEvent;
    }
}
//# sourceMappingURL=BaseNode.d.ts.map