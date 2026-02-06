import type { BaseNode } from '../nodes/BaseNode';
import type { GroupNode } from '../nodes/GroupNode';

export interface LayerNode {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  children?: LayerNode[];
}

export class LayerHierarchy {
  private static generateLayerName(node: BaseNode): string {
    const typeNames: Record<string, string> = {
      rectangle: 'Rectangle',
      ellipse: 'Ellipse',
      line: 'Line',
      star: 'Star',
      text: 'Text',
      group: 'Group'
    };
    return typeNames[node.type] || 'Layer';
  }

  static getHierarchy(container: BaseNode): LayerNode {
    const isGroup = (node: BaseNode): node is GroupNode => node.type === 'group';

    const processNode = (node: BaseNode): LayerNode => {
      const layer: LayerNode = {
        id: node.id,
        type: node.type,
        name: LayerHierarchy.generateLayerName(node),
        visible: node.visible,
        locked: node.locked
      };

      if (isGroup(node) && node.children.length > 0) {
        layer.children = node.children
          .filter((child): child is BaseNode => child instanceof BaseNode)
          .map(child => processNode(child))
          .reverse(); // Reverse to match visual stacking order
      }

      return layer;
    };

    return processNode(container);
  }
}

// Custom event for layer hierarchy changes
export type LayerHierarchyChangedEvent = CustomEvent<{
  hierarchy: LayerNode;
}>;

declare global {
  interface WindowEventMap {
    'layer:changed': LayerHierarchyChangedEvent;
  }
}
