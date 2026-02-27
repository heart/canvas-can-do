import { Container } from 'pixi.js';
import { BaseNode } from '../nodes/BaseNode';
import { GroupNode } from '../nodes/GroupNode';
import { FrameNode } from '../nodes/FrameNode';

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
      image: 'Image',
      group: 'Group',
      frame: 'Frame',
    };
    return typeNames[node.type] || 'Layer';
  }

  static getHierarchy(container: Container): LayerNode {
    const isContainerNode = (node: BaseNode): node is GroupNode | FrameNode =>
      node.type === 'group' || node.type === 'frame';

    const processNode = (node: Container): LayerNode => {
      // If it's not a BaseNode, create a basic layer node
      if (!(node instanceof BaseNode)) {
        return {
          id: 'root',
          type: 'root',
          name: 'Root',
          visible: node.visible,
          locked: false,
          children: node.children
            .filter((child): child is BaseNode => child instanceof BaseNode)
            .map((child) => processNode(child))
            .reverse(),
        };
      }
      const layer: LayerNode = {
        id: node.id,
        type: node.type,
        name: LayerHierarchy.generateLayerName(node),
        visible: node.visible,
        locked: node.locked,
      };

      if (isContainerNode(node) && node.children.length > 0) {
        layer.children = node.children
          .filter((child): child is BaseNode => child instanceof BaseNode)
          .map((child) => processNode(child))
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
  selectedIds?: string[];
}>;

declare global {
  interface WindowEventMap {
    'layer:changed': LayerHierarchyChangedEvent;
  }
}
