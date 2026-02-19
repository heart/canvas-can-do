import { Container, Graphics, Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';
import { TransformController } from './TransformController';
import { LineTransformController } from './LineTransformController';
import type { LineNode } from '../nodes/LineNode';
import { GroupNode } from '../nodes/GroupNode';
import { LayerHierarchy } from '../layers/LayerHierarchy';
import type { InspectableNode } from '../nodes';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private isMultiSelect = false;
  private selectionGraphics: Graphics;
  private transformController: TransformController;
  private lineTransformController: LineTransformController;
  private shiftKey = false;

  constructor(toolsLayer: Container) {
    this.transformController = new TransformController();
    this.lineTransformController = new LineTransformController();

    this.selectionGraphics = new Graphics();
    toolsLayer.addChild(this.selectionGraphics);
  }

  startTransform(point: Point, handle?: string) {
    if (this.selectedNodes.size !== 1) return; // disable transforms for multi-select
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (!selectedNode) return;

    if (selectedNode.type === 'line') {
      if (handle === 'start' || handle === 'end' || handle === 'move') {
        this.lineTransformController.startTransform(selectedNode as LineNode, point, handle as 'start' | 'end' | 'move');
      }
    } else {
      this.transformController.startTransform(selectedNode, point, handle);
    }
  }

  updateTransform(point: Point) {
    if (this.selectedNodes.size !== 1) return;
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode?.type === 'line') {
      this.lineTransformController.updateTransform(point, this.shiftKey);
    } else {
      this.transformController.updateTransform(point, this.shiftKey);
    }
    this.updateSelectionVisuals();
    this.dispatchPropertiesChanged();
  }

  endTransform() {
    if (this.selectedNodes.size !== 1) return;
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode?.type === 'line') {
      this.lineTransformController.endTransform();
    } else {
      this.transformController.endTransform();
    }
    this.updateSelectionVisuals();
    this.dispatchPropertiesChanged();
  }

  hitTestHandle(point: Point): string | null {
    if (this.selectedNodes.size === 0) return null;
    if (this.selectedNodes.size > 1) return null; // no handles for multi-select

    const node = Array.from(this.selectedNodes)[0];
    // groups now allow full handles

    if (node.type === 'line') {
      const lineNode = node as LineNode;
      const scale = this.getWorldScale();
      const handleSize = 12 / scale;
      const hitTolerance = 10 / scale;

      // Check start point handle
      const startX = lineNode.x + lineNode.startX;
      const startY = lineNode.y + lineNode.startY;
      if (Math.abs(point.x - startX) < handleSize && Math.abs(point.y - startY) < handleSize) {
        return 'start';
      }

      // Check end point handle
      const endX = lineNode.x + lineNode.endX;
      const endY = lineNode.y + lineNode.endY;
      if (Math.abs(point.x - endX) < handleSize && Math.abs(point.y - endY) < handleSize) {
        return 'end';
      }

      // Check if point is near the line for moving
      const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const distance =
        Math.abs(
          (endY - startY) * point.x - (endX - startX) * point.y + endX * startY - endY * startX
        ) / lineLength;

      if (distance < hitTolerance) {
        return 'move';
      }

      // Check center grip rectangle
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      if (Math.abs(point.x - midX) < handleSize && Math.abs(point.y - midY) < handleSize) {
        return 'move';
      }
    } else {
      // Use intrinsic size and true center derived from current rotation
      const width = node.width;
      const height = node.height;
      const r = node.rotation;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const centerX = node.position.x + (width / 2) * cos - (height / 2) * sin;
      const centerY = node.position.y + (width / 2) * sin + (height / 2) * cos;

      // Convert point into overlay-local space (centered, unrotated)
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const ux = dx * cos + dy * sin; // inverse rotate
      const uy = -dx * sin + dy * cos;
      const scale = this.getWorldScale();
      const handleSize = 12 / scale; // Size of handle hit area (tap-friendly)
      const rotationHandleOffset = 20 / scale;

      // Check rotation handle first (top middle)
      const rotateHandle = new Point(0, -height / 2 - rotationHandleOffset);
      if (
        Math.abs(ux - rotateHandle.x) < handleSize &&
        Math.abs(uy - rotateHandle.y) < handleSize
      ) {
        return 'rotate';
      }

      // Check resize handles
      const handles = [
        { x: -width / 2, y: -height / 2, name: 'top-left' },
        { x: 0, y: -height / 2, name: 'top' },
        { x: width / 2, y: -height / 2, name: 'top-right' },
        { x: width / 2, y: 0, name: 'right' },
        { x: width / 2, y: height / 2, name: 'bottom-right' },
        { x: 0, y: height / 2, name: 'bottom' },
        { x: -width / 2, y: height / 2, name: 'bottom-left' },
        { x: -width / 2, y: 0, name: 'left' },
      ];

      for (const handle of handles) {
        if (Math.abs(ux - handle.x) < handleSize && Math.abs(uy - handle.y) < handleSize) {
          return handle.name;
        }
      }

      // Check if point is inside selection bounds
      if (ux >= -width / 2 && ux <= width / 2 && uy >= -height / 2 && uy <= height / 2) {
        return 'move';
      }
    }

    return null;
  }

  setMultiSelect(enabled: boolean) {
    this.isMultiSelect = enabled;
  }

  setShiftKey(enabled: boolean) {
    this.shiftKey = enabled;
  }

  select(node: BaseNode | null) {
    if (!this.isMultiSelect) {
      this.selectedNodes.clear();
    }

    if (node) {
      if (this.isMultiSelect && this.selectedNodes.has(node)) {
        // Toggle off
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    }

    this.updateSelectionVisuals();
    this.dispatchLayerChanged();
    this.dispatchSelectionChanged();
  }

  selectMany(nodes: BaseNode[]) {
    this.selectedNodes.clear();
    nodes.forEach((n) => {
      if (n) this.selectedNodes.add(n);
    });
    this.updateSelectionVisuals();
    this.dispatchLayerChanged();
    this.dispatchSelectionChanged();
  }

  createGroup() {
    if (this.selectedNodes.size < 2) return;

    const nodes = Array.from(this.selectedNodes);
    const parent = nodes[0].parent as Container | null;
    if (!parent) return;

    // Preserve original z-order
    const sorted = nodes
      .map((n) => ({ n, idx: parent.getChildIndex(n) }))
      .sort((a, b) => a.idx - b.idx)
      .map((e) => e.n);
    const insertIndex = sorted.length
      ? Math.min(...sorted.map((n) => parent.getChildIndex(n)))
      : parent.children.length;
    const bounds = this.getSelectionBounds();

    // Create group at top-left of bounds and re-parent children with local coords
    const group = new GroupNode({
      children: [],
      x: bounds.x,
      y: bounds.y,
    });

    sorted.forEach((node) => {
      // Adjust to group's local space
      node.position.set(node.position.x - bounds.x, node.position.y - bounds.y);
      parent.removeChild(node);
      group.addChild(node);
    });

    parent.addChildAt(group, insertIndex);

    // Clear selection and select the new group
    this.selectedNodes.clear();
    this.selectedNodes.add(group);
    this.updateSelectionVisuals();

    // Dispatch layer hierarchy changed event
    const event = new CustomEvent('layer:changed', {
      detail: {
        hierarchy: LayerHierarchy.getHierarchy(parent),
        selectedIds: Array.from(this.selectedNodes).map((n) => n.id),
      },
    });
    window.dispatchEvent(event);
    this.dispatchSelectionChanged();

    return group;
  }

  ungroupSelected(): BaseNode[] {
    if (this.selectedNodes.size !== 1) return [];
    const node = Array.from(this.selectedNodes)[0];
    if (!(node instanceof GroupNode)) return [];

    const parent = node.parent as Container | null;
    const groupIndex = parent ? parent.getChildIndex(node) : -1;
    const gScaleX = node.scale.x;
    const gScaleY = node.scale.y;
    const gRotation = node.rotation;

    // Move children to world (parent) space
    const children = [...node.children] as BaseNode[];
    children.forEach((child) => {
      const worldPos = node.toGlobal(child.position);
      // Bake group transform into child
      child.position.copyFrom(worldPos);
      child.scale.set(child.scale.x * gScaleX, child.scale.y * gScaleY);
      child.rotation += gRotation;
      // Normalize scale back to 1: bake scale into intrinsic size
      this.normalizeNodeScale(child);
      node.removeChild(child);
    });

    // Remove group from parent and insert children at the group's position to preserve z-order
    if (parent) {
      parent.removeChild(node);
      children.forEach((child, i) => {
        parent.addChildAt(child, groupIndex + i);
      });
    }

    // Replace selection with the children
    this.selectedNodes.clear();
    children.forEach((c) => this.selectedNodes.add(c));
    this.updateSelectionVisuals();

    // Dispatch layer hierarchy changed event
    if (parent) {
      const event = new CustomEvent('layer:changed', {
        detail: {
          hierarchy: LayerHierarchy.getHierarchy(parent),
          selectedIds: Array.from(this.selectedNodes).map((n) => n.id),
        },
      });
      window.dispatchEvent(event);
    }
    this.dispatchSelectionChanged();

    return children;
  }

  getSelectionBounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.selectedNodes.forEach((node) => {
      const bounds = node.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private normalizeNodeScale(node: BaseNode) {
    if (node.scale.x === 1 && node.scale.y === 1) return;
    const sx = node.scale.x;
    const sy = node.scale.y;
    node.width = node.width * sx;
    node.height = node.height * sy;
    node.scale.set(1, 1);
  }

  isSelected(node: BaseNode): boolean {
    return this.selectedNodes.has(node);
  }

  getSelectedNodes(): BaseNode[] {
    return Array.from(this.selectedNodes);
  }

  reorderSelected(container: Container, direction: -1 | 1): boolean {
    if (this.selectedNodes.size !== 1) return false;
    const node = Array.from(this.selectedNodes)[0];
    if (node.parent !== container) return false;

    const currentIndex = container.getChildIndex(node);
    let newIndex = currentIndex + direction;
    newIndex = Math.max(0, Math.min(container.children.length - 1, newIndex));
    if (newIndex === currentIndex) return false;

    container.setChildIndex(node, newIndex);
    this.dispatchLayerChanged();
    return true;
  }

  deleteSelected(container: Container): BaseNode[] {
    const removed: BaseNode[] = [];
    this.selectedNodes.forEach((node) => {
      if (node.parent === container) {
        container.removeChild(node);
        removed.push(node);
      }
    });
    this.clear();
    return removed;
  }

  clear() {
    this.selectedNodes.clear();
    this.updateSelectionVisuals();
    this.dispatchLayerChanged();
    this.dispatchSelectionChanged();
  }

  nudgeSelected(dx: number, dy: number): boolean {
    if (this.selectedNodes.size === 0) return false;
    this.selectedNodes.forEach((node) => {
      node.position.x += dx;
      node.position.y += dy;
    });
    this.updateSelectionVisuals();
    this.dispatchLayerChanged();
    this.dispatchPropertiesChanged();
    return true;
  }

  private updateSelectionVisuals() {
    this.selectionGraphics.clear();

    if (this.selectedNodes.size === 0) return;

    const scale = this.getWorldScale();
    const inv = 1 / scale;
    const strokeWidth = 2 * inv;
    const lineWidth = 1 * inv;
    const handleRadius = 6 * inv;
    const rotationHandleOffset = 20 * inv;

    // Multi-select: draw a single bounding box, no handles/rotation
    if (this.selectedNodes.size > 1) {
      const bounds = this.getSelectionBounds();
      // Convert global bounds to the selectionGraphics' parent space (world/tools)
      const parent = this.selectionGraphics.parent as Container;
      const tl = parent.toLocal(new Point(bounds.x, bounds.y));
      const br = parent.toLocal(new Point(bounds.x + bounds.width, bounds.y + bounds.height));
      const w = br.x - tl.x;
      const h = br.y - tl.y;

      this.selectionGraphics.position.set(0, 0);
      this.selectionGraphics.rotation = 0;
      this.selectionGraphics.pivot.set(0, 0);
      this.selectionGraphics.rect(tl.x, tl.y, w, h);
      this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 1 });
      return;
    }

    // Single selection
    for (const node of this.selectedNodes) {
      const width = node.width;
      const height = node.height;
      const r = node.rotation;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const centerX = node.position.x + (width / 2) * cos - (height / 2) * sin;
      const centerY = node.position.y + (width / 2) * sin + (height / 2) * cos;

      // Position overlay at true center (matches virtual rotation pivot)
      this.selectionGraphics.position.set(centerX, centerY);
      this.selectionGraphics.rotation = node.rotation;
      this.selectionGraphics.pivot.set(0, 0);

      if (node.type === 'line') {
        const lineNode = node as LineNode;

        // Reset transform for line
        this.selectionGraphics.position.set(0, 0);
        this.selectionGraphics.rotation = 0;

        // Draw line
        this.selectionGraphics.moveTo(lineNode.x + lineNode.startX, lineNode.y + lineNode.startY);
        this.selectionGraphics.lineTo(lineNode.x + lineNode.endX, lineNode.y + lineNode.endY);
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 1 });

        // Draw endpoints
        const endpoints = [
          { x: lineNode.x + lineNode.startX, y: lineNode.y + lineNode.startY },
          { x: lineNode.x + lineNode.endX, y: lineNode.y + lineNode.endY },
        ];

        for (const point of endpoints) {
          this.selectionGraphics.circle(point.x, point.y, handleRadius);
          this.selectionGraphics.fill({ color: 0xffffff });
          this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
        }

        // Center grip for moving the line
        const midX = (lineNode.x + lineNode.startX + lineNode.x + lineNode.endX) / 2;
        const midY = (lineNode.y + lineNode.startY + lineNode.y + lineNode.endY) / 2;
        const half = 6 * inv;
        this.selectionGraphics.rect(midX - half, midY - half, half * 2, half * 2);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
      } else {
        // Draw selection rectangle
        this.selectionGraphics.rect(-width / 2, -height / 2, width, height);
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 1 });

        // Draw control points
        const controlPoints = [
          { x: -width / 2, y: -height / 2, name: 'top-left' }, // Top-left
          { x: 0, y: -height / 2, name: 'top' }, // Top-middle
          { x: width / 2, y: -height / 2, name: 'top-right' }, // Top-right
          { x: width / 2, y: 0, name: 'right' }, // Middle-right
          { x: width / 2, y: height / 2, name: 'bottom-right' }, // Bottom-right
          { x: 0, y: height / 2, name: 'bottom' }, // Bottom-middle
          { x: -width / 2, y: height / 2, name: 'bottom-left' }, // Bottom-left
          { x: -width / 2, y: 0, name: 'left' }, // Middle-left
        ];

        for (const point of controlPoints) {
          this.selectionGraphics.circle(point.x, point.y, handleRadius);
          this.selectionGraphics.fill({ color: 0xffffff });
          this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
        }

        // Draw rotation handle line and knob (above top-middle)
        const rotationHandleY = -height / 2 - rotationHandleOffset;
        const rotationX = 0;
        this.selectionGraphics.moveTo(rotationX, -height / 2);
        this.selectionGraphics.lineTo(rotationX, rotationHandleY);
        this.selectionGraphics.stroke({ color: 0x0099ff, width: lineWidth, alpha: 0.9 });
        this.selectionGraphics.circle(rotationX, rotationHandleY, 5 * inv);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: lineWidth });
      }
    }
  }

  private getWorldScale(): number {
    const parent = this.selectionGraphics.parent as Container | null;
    if (!parent) return 1;
    const wt = parent.worldTransform;
    const scaleX = Math.hypot(wt.a, wt.b);
    const scaleY = Math.hypot(wt.c, wt.d);
    const scale = (scaleX + scaleY) / 2 || 1;
    return scale;
  }

  private dispatchLayerChanged() {
    const parent = this.selectedNodes.size ? Array.from(this.selectedNodes)[0].parent : null;
    if (parent) {
      const hierarchy = LayerHierarchy.getHierarchy(parent);
      const selectedIds = Array.from(this.selectedNodes).map((n) => n.id);
      window.dispatchEvent(
        new CustomEvent('layer:changed', {
          detail: { hierarchy, selectedIds },
        })
      );
    }
  }

  private dispatchPropertiesChanged() {
    const nodes: InspectableNode[] = Array.from(this.selectedNodes)
      .map((n) => (typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null))
      .filter((n): n is InspectableNode => n !== null);

    const event = new CustomEvent('properties:changed', {
      detail: { nodes },
    });
    window.dispatchEvent(event);
  }

  private dispatchSelectionChanged() {
    const nodes: InspectableNode[] = Array.from(this.selectedNodes)
      .map((n) => (typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null))
      .filter((n): n is InspectableNode => n !== null);
    const selectedIds = Array.from(this.selectedNodes).map((n) => n.id);

    const event = new CustomEvent('selection:changed', {
      detail: { nodes, selectedIds },
    });
    window.dispatchEvent(event);
  }
}
