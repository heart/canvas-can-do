import { Container, Graphics, Point } from 'pixi.js';
import { BaseNode } from '../nodes/BaseNode';
import { TransformController } from './TransformController';
import { LineTransformController } from './LineTransformController';
import type { LineNode } from '../nodes/LineNode';
import { GroupNode } from '../nodes/GroupNode';
import { FrameNode } from '../nodes/FrameNode';
import { LayerHierarchy } from '../layers/LayerHierarchy';
import type { InspectableNode } from '../nodes';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private isMultiSelect = false;
  private selectionGraphics: Graphics;
  private transformController: TransformController;
  private lineTransformController: LineTransformController;
  private shiftKey = false;
  private eventTarget: EventTarget;
  private propertiesChangedRafId: number | null = null;
  private objectSnapEnabled = true;
  private objectSnapThreshold = 6;
  private singleMoveTransform:
    | {
        node: BaseNode;
        startPoint: Point;
        startX: number;
        startY: number;
        startBounds: { x: number; y: number; width: number; height: number };
      }
    | null = null;
  private singleResizeTransform:
    | {
        node: BaseNode;
        startPoint: Point;
        startState: { x: number; y: number; width: number; height: number };
        handle: string;
      }
    | null = null;
  private multiTransform:
    | {
        mode: 'move' | 'resize';
        handle?: string;
        startPoint: Point;
        startBounds: { x: number; y: number; width: number; height: number };
        nodes: Array<{
          node: BaseNode;
          x: number;
          y: number;
          width: number;
          height: number;
          line?: { startX: number; startY: number; endX: number; endY: number };
        }>;
      }
    | null = null;

  constructor(toolsLayer: Container, eventTarget: EventTarget) {
    this.transformController = new TransformController();
    this.lineTransformController = new LineTransformController();
    this.eventTarget = eventTarget;

    this.selectionGraphics = new Graphics();
    toolsLayer.addChild(this.selectionGraphics);
  }

  startTransform(point: Point, handle?: string) {
    if (this.selectedNodes.size === 0) return;
    const selected = Array.from(this.selectedNodes);
    if (selected.some((node) => !node.visible || node.locked)) {
      return;
    }

    if (this.selectedNodes.size > 1) {
      const mode: 'move' | 'resize' = !handle || handle === 'move' ? 'move' : 'resize';
      const bounds = this.getSelectedBoundsInParentSpace();
      if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return;
      this.multiTransform = {
        mode,
        handle,
        startPoint: point.clone(),
        startBounds: bounds,
        nodes: Array.from(this.selectedNodes).map((node) => ({
          node,
          x: node.position.x,
          y: node.position.y,
          width: node.width,
          height: node.height,
          line:
            node.type === 'line'
              ? {
                  startX: (node as LineNode).startX,
                  startY: (node as LineNode).startY,
                  endX: (node as LineNode).endX,
                  endY: (node as LineNode).endY,
                }
              : undefined,
        })),
      };
      return;
    }

    const selectedNode = Array.from(this.selectedNodes)[0];
    if (!selectedNode) return;
    if (selectedNode.type === 'frame' && handle === 'rotate') {
      return;
    }
    this.singleMoveTransform = null;
    this.singleResizeTransform = null;
    if (handle === 'move' && selectedNode.type !== 'line') {
      this.singleMoveTransform = {
        node: selectedNode,
        startPoint: point.clone(),
        startX: selectedNode.position.x,
        startY: selectedNode.position.y,
        startBounds: this.getNodeBoundsInParentSpace(selectedNode),
      };
      return;
    }
    if (
      selectedNode.type !== 'line' &&
      handle &&
      handle !== 'move' &&
      handle !== 'rotate'
    ) {
      this.singleResizeTransform = {
        node: selectedNode,
        startPoint: point.clone(),
        startState: {
          x: selectedNode.position.x,
          y: selectedNode.position.y,
          width: selectedNode.width,
          height: selectedNode.height,
        },
        handle,
      };
      return;
    }

    if (selectedNode.type === 'line') {
      if (handle === 'start' || handle === 'end' || handle === 'move') {
        this.lineTransformController.startTransform(
          selectedNode as LineNode,
          point,
          handle as 'start' | 'end' | 'move'
        );
      }
    } else {
      this.transformController.startTransform(selectedNode, point, handle);
    }
  }

  updateTransform(point: Point) {
    if (this.selectedNodes.size === 0) return;

    if (this.multiTransform) {
      this.updateMultiTransform(point);
      this.updateSelectionVisuals();
      this.schedulePropertiesChanged();
      return;
    }

    if (this.singleMoveTransform) {
      const state = this.singleMoveTransform;
      const delta = this.getDeltaInParentSpace(state.node.parent as Container | null, state.startPoint, point);
      let dx = delta.x;
      let dy = delta.y;
      if (this.objectSnapEnabled) {
        const snapped = this.getSnappedMoveDelta(
          state.startBounds,
          dx,
          dy,
          new Set([state.node])
        );
        dx = snapped.dx;
        dy = snapped.dy;
      }
      state.node.position.set(Math.round(state.startX + dx), Math.round(state.startY + dy));
      this.updateSelectionVisuals();
      this.schedulePropertiesChanged();
      return;
    }
    if (this.singleResizeTransform) {
      this.updateSingleResizeTransform(point);
      this.updateSelectionVisuals();
      this.schedulePropertiesChanged();
      return;
    }

    if (this.selectedNodes.size !== 1) return;
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode?.type === 'line') {
      this.lineTransformController.updateTransform(point, this.shiftKey);
    } else {
      this.transformController.updateTransform(point, this.shiftKey);
    }
    this.updateSelectionVisuals();
    this.schedulePropertiesChanged();
  }

  endTransform() {
    if (this.selectedNodes.size === 0) return;

    if (this.multiTransform) {
      this.multiTransform = null;
    } else if (this.singleMoveTransform) {
      this.singleMoveTransform = null;
    } else if (this.singleResizeTransform) {
      this.singleResizeTransform = null;
    } else if (this.selectedNodes.size === 1) {
      const selectedNode = Array.from(this.selectedNodes)[0];
      if (selectedNode?.type === 'line') {
        this.lineTransformController.endTransform();
      } else {
        this.transformController.endTransform();
      }
    } else {
      return;
    }
    this.cancelScheduledPropertiesChanged();
    this.updateSelectionVisuals();
    this.dispatchPropertiesChanged();
    this.dispatchSelectionChanged();
  }

  hitTestHandle(point: Point): string | null {
    if (this.selectedNodes.size === 0) return null;
    if (this.selectedNodes.size > 1) {
      const bounds = this.getSelectedBoundsInParentSpace();
      const scale = this.getWorldScale();
      const handleSize = 12 / scale;
      const handles = [
        { x: bounds.x, y: bounds.y, name: 'top-left' },
        { x: bounds.x + bounds.width / 2, y: bounds.y, name: 'top' },
        { x: bounds.x + bounds.width, y: bounds.y, name: 'top-right' },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, name: 'right' },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, name: 'bottom-right' },
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, name: 'bottom' },
        { x: bounds.x, y: bounds.y + bounds.height, name: 'bottom-left' },
        { x: bounds.x, y: bounds.y + bounds.height / 2, name: 'left' },
      ];

      for (const handle of handles) {
        if (Math.abs(point.x - handle.x) < handleSize && Math.abs(point.y - handle.y) < handleSize) {
          return handle.name;
        }
      }

      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        return 'move';
      }
      return null;
    }

    const node = Array.from(this.selectedNodes)[0];
    // groups now allow full handles

    if (node.type === 'line') {
      const lineNode = node as LineNode;
      const scale = this.getWorldScale();
      const handleSize = 12 / scale;
      const hitTolerance = 10 / scale;
      const { startX, startY, endX, endY } = this.getLineEndpointsInSelectionSpace(lineNode);

      // Check start point handle
      if (Math.abs(point.x - startX) < handleSize && Math.abs(point.y - startY) < handleSize) {
        return 'start';
      }

      // Check end point handle
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
      if (node.type === 'frame' || node.parent instanceof GroupNode || node.parent instanceof FrameNode) {
        const bounds = this.getNodeBoundsInSelectionSpace(node);
        const scale = this.getWorldScale();
        const handleSize = 12 / scale;
        const handles = [
          { x: bounds.x, y: bounds.y, name: 'top-left' },
          { x: bounds.x + bounds.width / 2, y: bounds.y, name: 'top' },
          { x: bounds.x + bounds.width, y: bounds.y, name: 'top-right' },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, name: 'right' },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height, name: 'bottom-right' },
          { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, name: 'bottom' },
          { x: bounds.x, y: bounds.y + bounds.height, name: 'bottom-left' },
          { x: bounds.x, y: bounds.y + bounds.height / 2, name: 'left' },
        ];

        for (const handle of handles) {
          if (Math.abs(point.x - handle.x) < handleSize && Math.abs(point.y - handle.y) < handleSize) {
            return handle.name;
          }
        }

        if (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        ) {
          return 'move';
        }
        return null;
      }

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

  setObjectSnapEnabled(enabled: boolean) {
    this.objectSnapEnabled = enabled;
  }

  select(node: BaseNode | null) {
    if (!this.isMultiSelect) {
      this.selectedNodes.clear();
    }

    if (node && node.visible && !node.locked) {
      if (this.isMultiSelect && this.selectedNodes.has(node)) {
        // Toggle off
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    }

    this.updateSelectionVisuals();
    this.dispatchSelectionChanged();
  }

  selectMany(nodes: BaseNode[]) {
    this.selectedNodes.clear();
    nodes.forEach((n) => {
      if (n && n.visible && !n.locked) this.selectedNodes.add(n);
    });
    this.updateSelectionVisuals();
    this.dispatchSelectionChanged();
  }

  createGroup() {
    if (this.selectedNodes.size < 2) return;

    const nodes = Array.from(this.selectedNodes);
    if (nodes.some((node) => node instanceof FrameNode)) return;
    const parent = nodes[0].parent as Container | null;
    if (!parent) return;
    if (nodes.some((node) => node.parent !== parent)) return;

    // Preserve original z-order
    const sorted = nodes
      .map((n) => ({ n, idx: parent.getChildIndex(n) }))
      .sort((a, b) => a.idx - b.idx)
      .map((e) => e.n);
    const insertIndex = sorted.length
      ? Math.min(...sorted.map((n) => parent.getChildIndex(n)))
      : parent.children.length;
    const { minX: groupX, minY: groupY } = sorted
      .map((node) => this.getNodeBoundsInParentSpace(node))
      .reduce(
        (acc, b) => ({
          minX: Math.min(acc.minX, b.x),
          minY: Math.min(acc.minY, b.y),
        }),
        { minX: Infinity, minY: Infinity }
      );

    // Create group at top-left of bounds and re-parent children with local coords
    const group = new GroupNode({
      children: [],
      x: groupX,
      y: groupY,
    });

    const transforms = sorted.map((node) => ({
      node,
      transform: this.captureNodeWorldTransform(node),
    }));

    sorted.forEach((node) => {
      parent.removeChild(node);
    });

    parent.addChildAt(group, insertIndex);

    transforms.forEach(({ node, transform }) => {
      group.addChild(node);
      this.applyWorldTransformToParent(node, group, transform);
    });

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
    this.eventTarget.dispatchEvent(event);
    this.dispatchSelectionChanged();

    return group;
  }

  ungroupSelected(): BaseNode[] {
    if (this.selectedNodes.size !== 1) return [];
    const node = Array.from(this.selectedNodes)[0];
    if (!(node instanceof GroupNode)) return [];

    const parent = node.parent as Container | null;
    const groupIndex = parent ? parent.getChildIndex(node) : -1;
    // Move children to parent while preserving their world transforms.
    const children = [...node.children] as BaseNode[];
    const childTransforms = children.map((child) => ({
      child,
      transform: this.captureNodeWorldTransform(child),
    }));
    children.forEach((child) => {
      node.removeChild(child);
    });

    // Remove group from parent and insert children at the group's position to preserve z-order
    if (parent) {
      parent.removeChild(node);
      childTransforms.forEach(({ child, transform }, i) => {
        parent.addChildAt(child, groupIndex + i);
        this.applyWorldTransformToParent(child, parent, transform);
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
      this.eventTarget.dispatchEvent(event);
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

  isSelected(node: BaseNode): boolean {
    return this.selectedNodes.has(node);
  }

  getSelectedNodes(): BaseNode[] {
    return Array.from(this.selectedNodes);
  }

  reorderSelected(container: Container, direction: -1 | 1): boolean {
    if (this.selectedNodes.size !== 1) return false;
    const node = Array.from(this.selectedNodes)[0];
    if (!node.visible || node.locked) return false;
    const parent = node.parent as Container | null;
    if (!parent) return false;

    const currentIndex = parent.getChildIndex(node);
    let newIndex = currentIndex + direction;
    newIndex = Math.max(0, Math.min(parent.children.length - 1, newIndex));
    if (newIndex === currentIndex) return false;

    parent.setChildIndex(node, newIndex);
    this.dispatchLayerChanged(container);
    return true;
  }

  deleteSelected(container: Container): BaseNode[] {
    const removed: BaseNode[] = [];
    this.selectedNodes.forEach((node) => {
      if (node.parent) {
        node.parent.removeChild(node);
        removed.push(node);
      }
    });
    this.clear();
    if (removed.length) {
      this.dispatchLayerChanged(container);
    }
    return removed;
  }

  clear() {
    this.selectedNodes.clear();
    this.updateSelectionVisuals();
    this.dispatchSelectionChanged();
  }

  nudgeSelected(dx: number, dy: number): boolean {
    if (this.selectedNodes.size === 0) return false;
    const nodes = Array.from(this.selectedNodes).filter((node) => node.visible && !node.locked);
    if (!nodes.length) return false;
    nodes.forEach((node) => {
      node.position.x += dx;
      node.position.y += dy;
    });
    this.updateSelectionVisuals();
    this.dispatchPropertiesChanged();
    this.dispatchSelectionChanged();
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

    // Multi-select: draw a single bounding box with resize handles.
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

       const controlPoints = [
        { x: tl.x, y: tl.y },
        { x: tl.x + w / 2, y: tl.y },
        { x: tl.x + w, y: tl.y },
        { x: tl.x + w, y: tl.y + h / 2 },
        { x: tl.x + w, y: tl.y + h },
        { x: tl.x + w / 2, y: tl.y + h },
        { x: tl.x, y: tl.y + h },
        { x: tl.x, y: tl.y + h / 2 },
      ];

      for (const point of controlPoints) {
        this.selectionGraphics.circle(point.x, point.y, handleRadius);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
      }
      return;
    }

    // Single selection
    for (const node of this.selectedNodes) {
      if (node.type === 'line') {
        const lineNode = node as LineNode;
        const { startX, startY, endX, endY } = this.getLineEndpointsInSelectionSpace(lineNode);

        // Reset transform for line
        this.selectionGraphics.position.set(0, 0);
        this.selectionGraphics.rotation = 0;

        // Draw line
        this.selectionGraphics.moveTo(startX, startY);
        this.selectionGraphics.lineTo(endX, endY);
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 1 });

        // Draw endpoints
        const endpoints = [
          { x: startX, y: startY },
          { x: endX, y: endY },
        ];

        for (const point of endpoints) {
          this.selectionGraphics.circle(point.x, point.y, handleRadius);
          this.selectionGraphics.fill({ color: 0xffffff });
          this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
        }

        // Center grip for moving the line
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const half = 6 * inv;
        this.selectionGraphics.rect(midX - half, midY - half, half * 2, half * 2);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
      } else {
        if (node.type === 'frame' || node.parent instanceof GroupNode || node.parent instanceof FrameNode) {
          const bounds = this.getNodeBoundsInSelectionSpace(node);
          this.selectionGraphics.position.set(0, 0);
          this.selectionGraphics.rotation = 0;
          this.selectionGraphics.pivot.set(0, 0);
          this.selectionGraphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
          this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 1 });

          const controlPoints = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width / 2, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height / 2 },
          ];

          for (const point of controlPoints) {
            this.selectionGraphics.circle(point.x, point.y, handleRadius);
            this.selectionGraphics.fill({ color: 0xffffff });
            this.selectionGraphics.stroke({ color: 0x0099ff, width: strokeWidth, alpha: 0.9 });
          }
          continue;
        }

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

  private dispatchLayerChanged(parent?: Container | null) {
    const layerRoot = parent ?? (this.selectedNodes.size ? Array.from(this.selectedNodes)[0].parent : null);
    if (!layerRoot) return;

    const hierarchy = LayerHierarchy.getHierarchy(layerRoot);
    const selectedIds = Array.from(this.selectedNodes).map((n) => n.id);
    this.eventTarget.dispatchEvent(
      new CustomEvent('layer:changed', {
        detail: { hierarchy, selectedIds },
      })
    );
  }

  private dispatchPropertiesChanged() {
    const nodes: InspectableNode[] = Array.from(this.selectedNodes)
      .map((n) => (typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null))
      .filter((n): n is InspectableNode => n !== null);

    const event = new CustomEvent('properties:changed', {
      detail: { nodes },
    });
    this.eventTarget.dispatchEvent(event);
  }

  private schedulePropertiesChanged() {
    if (this.propertiesChangedRafId !== null) return;
    this.propertiesChangedRafId = requestAnimationFrame(() => {
      this.propertiesChangedRafId = null;
      this.dispatchPropertiesChanged();
      this.dispatchSelectionChanged();
    });
  }

  private cancelScheduledPropertiesChanged() {
    if (this.propertiesChangedRafId === null) return;
    cancelAnimationFrame(this.propertiesChangedRafId);
    this.propertiesChangedRafId = null;
  }

  private dispatchSelectionChanged() {
    const nodes: InspectableNode[] = Array.from(this.selectedNodes)
      .map((n) => (typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null))
      .filter((n): n is InspectableNode => n !== null);
    const selectedIds = Array.from(this.selectedNodes).map((n) => n.id);

    const event = new CustomEvent('selection:changed', {
      detail: { nodes, selectedIds },
    });
    this.eventTarget.dispatchEvent(event);
  }

  private updateMultiTransform(point: Point) {
    const state = this.multiTransform;
    if (!state) return;

    const dx = point.x - state.startPoint.x;
    const dy = point.y - state.startPoint.y;

    if (state.mode === 'move') {
      let nextDx = dx;
      let nextDy = dy;
      if (this.objectSnapEnabled) {
        const excluded = new Set(state.nodes.map((n) => n.node));
        const snapped = this.getSnappedMoveDelta(state.startBounds, dx, dy, excluded);
        nextDx = snapped.dx;
        nextDy = snapped.dy;
      }
      state.nodes.forEach(({ node, x, y }) => {
        node.position.set(Math.round(x + nextDx), Math.round(y + nextDy));
      });
      return;
    }

    const start = state.startBounds;
    const right = start.x + start.width;
    const bottom = start.y + start.height;
    const centerX = start.x + start.width / 2;
    const centerY = start.y + start.height / 2;

    let nextX = start.x;
    let nextY = start.y;
    let nextW = start.width;
    let nextH = start.height;
    const MIN_SIZE = 10;
    const handle = state.handle ?? 'bottom-right';
    const hasLeft = handle.includes('left');
    const hasRight = handle.includes('right');
    const hasTop = handle.includes('top');
    const hasBottom = handle.includes('bottom');

    if (hasRight) nextW = start.width + dx;
    if (hasLeft) {
      nextW = start.width - dx;
      nextX = start.x + dx;
    }
    if (hasBottom) nextH = start.height + dy;
    if (hasTop) {
      nextH = start.height - dy;
      nextY = start.y + dy;
    }

    if (this.shiftKey) {
      const ratio = start.width / Math.max(1, start.height);
      const hasHorizontal = hasLeft || hasRight;
      const hasVertical = hasTop || hasBottom;
      if (hasHorizontal && hasVertical) {
        const targetW = Math.max(MIN_SIZE, nextW);
        const targetH = Math.max(MIN_SIZE, nextH);
        if (Math.abs(targetW / ratio - targetH) > Math.abs(targetH * ratio - targetW)) {
          nextH = targetW / ratio;
        } else {
          nextW = targetH * ratio;
        }
        if (hasLeft) nextX = right - nextW;
        if (hasTop) nextY = bottom - nextH;
      } else if (hasHorizontal) {
        nextH = nextW / ratio;
        nextY = centerY - nextH / 2;
      } else if (hasVertical) {
        nextW = nextH * ratio;
        nextX = centerX - nextW / 2;
      }
    }

    if (nextW < MIN_SIZE) {
      nextW = MIN_SIZE;
      if (hasLeft) nextX = right - nextW;
    }
    if (nextH < MIN_SIZE) {
      nextH = MIN_SIZE;
      if (hasTop) nextY = bottom - nextH;
    }

    if (this.objectSnapEnabled) {
      const excluded = new Set(state.nodes.map((n) => n.node));
      const snapped = this.getSnappedResizeRect(
        { x: nextX, y: nextY, width: nextW, height: nextH },
        handle,
        { x: start.x, y: start.y, width: start.width, height: start.height },
        excluded
      );
      nextX = snapped.x;
      nextY = snapped.y;
      nextW = snapped.width;
      nextH = snapped.height;
    }

    const sx = nextW / Math.max(1, start.width);
    const sy = nextH / Math.max(1, start.height);

    state.nodes.forEach(({ node, x, y, width, height, line }) => {
      if (node.type === 'line' && line) {
        const startWX = x + line.startX;
        const startWY = y + line.startY;
        const endWX = x + line.endX;
        const endWY = y + line.endY;

        const scaledStartX = nextX + (startWX - start.x) * sx;
        const scaledStartY = nextY + (startWY - start.y) * sy;
        const scaledEndX = nextX + (endWX - start.x) * sx;
        const scaledEndY = nextY + (endWY - start.y) * sy;

        const lineNode = node as LineNode;
        const sx0 = Math.round(scaledStartX);
        const sy0 = Math.round(scaledStartY);
        const ex0 = Math.round(scaledEndX);
        const ey0 = Math.round(scaledEndY);
        lineNode.position.set(sx0, sy0);
        lineNode.startX = 0;
        lineNode.startY = 0;
        lineNode.endX = ex0 - sx0;
        lineNode.endY = ey0 - sy0;
        lineNode.refresh();
        return;
      }

      const nx = nextX + (x - start.x) * sx;
      const ny = nextY + (y - start.y) * sy;
      node.position.set(Math.round(nx), Math.round(ny));
      node.width = Math.max(1, Math.round(width * sx));
      node.height = Math.max(1, Math.round(height * sy));
    });
  }

  private getSnappedMoveDelta(
    startBounds: { x: number; y: number; width: number; height: number },
    dx: number,
    dy: number,
    excluded: Set<BaseNode>
  ): { dx: number; dy: number } {
    const candidates = this.getSnapCandidates(excluded);
    if (!candidates.length) return { dx, dy };

    const moved = {
      x: startBounds.x + dx,
      y: startBounds.y + dy,
      width: startBounds.width,
      height: startBounds.height,
    };
    const movedX = [moved.x, moved.x + moved.width / 2, moved.x + moved.width];
    const movedY = [moved.y, moved.y + moved.height / 2, moved.y + moved.height];
    const threshold = this.objectSnapThreshold / this.getWorldScale();

    let snapX: number | null = null;
    let snapY: number | null = null;

    for (const c of candidates) {
      const cx = [c.x, c.x + c.width / 2, c.x + c.width];
      const cy = [c.y, c.y + c.height / 2, c.y + c.height];

      for (const a of movedX) {
        for (const b of cx) {
          const delta = b - a;
          const abs = Math.abs(delta);
          if (abs <= threshold && (snapX === null || abs < Math.abs(snapX))) {
            snapX = delta;
          }
        }
      }
      for (const a of movedY) {
        for (const b of cy) {
          const delta = b - a;
          const abs = Math.abs(delta);
          if (abs <= threshold && (snapY === null || abs < Math.abs(snapY))) {
            snapY = delta;
          }
        }
      }
    }

    return {
      dx: dx + (snapX ?? 0),
      dy: dy + (snapY ?? 0),
    };
  }

  private getSnappedResizeRect(
    rect: { x: number; y: number; width: number; height: number },
    handle: string,
    start: { x: number; y: number; width: number; height: number },
    excluded: Set<BaseNode>
  ): { x: number; y: number; width: number; height: number } {
    const candidates = this.getSnapCandidates(excluded);
    if (!candidates.length) return rect;

    const threshold = this.objectSnapThreshold / this.getWorldScale();
    const MIN_SIZE = 10;

    const hasLeft = handle.includes('left');
    const hasRight = handle.includes('right');
    const hasTop = handle.includes('top');
    const hasBottom = handle.includes('bottom');

    let nextX = rect.x;
    let nextY = rect.y;
    let nextW = rect.width;
    let nextH = rect.height;

    let bestX: number | null = null;
    let bestY: number | null = null;
    const targetLeft = nextX;
    const targetRight = nextX + nextW;
    const targetCenterX = nextX + nextW / 2;
    const targetTop = nextY;
    const targetBottom = nextY + nextH;
    const targetCenterY = nextY + nextH / 2;

    for (const c of candidates) {
      const cx = [c.x, c.x + c.width / 2, c.x + c.width];
      const cy = [c.y, c.y + c.height / 2, c.y + c.height];

      if (hasLeft) {
        for (const a of cx) {
          const d = a - targetLeft;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestX === null || abs < Math.abs(bestX))) bestX = d;
        }
      } else if (hasRight) {
        for (const a of cx) {
          const d = a - targetRight;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestX === null || abs < Math.abs(bestX))) bestX = d;
        }
      } else {
        for (const a of cx) {
          const d = a - targetCenterX;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestX === null || abs < Math.abs(bestX))) bestX = d;
        }
      }

      if (hasTop) {
        for (const a of cy) {
          const d = a - targetTop;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestY === null || abs < Math.abs(bestY))) bestY = d;
        }
      } else if (hasBottom) {
        for (const a of cy) {
          const d = a - targetBottom;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestY === null || abs < Math.abs(bestY))) bestY = d;
        }
      } else {
        for (const a of cy) {
          const d = a - targetCenterY;
          const abs = Math.abs(d);
          if (abs <= threshold && (bestY === null || abs < Math.abs(bestY))) bestY = d;
        }
      }
    }

    if (bestX !== null) {
      if (hasLeft) {
        const right = start.x + start.width;
        nextX += bestX;
        nextW = right - nextX;
      } else if (hasRight) {
        nextW += bestX;
      } else {
        nextX += bestX;
      }
    }
    if (bestY !== null) {
      if (hasTop) {
        const bottom = start.y + start.height;
        nextY += bestY;
        nextH = bottom - nextY;
      } else if (hasBottom) {
        nextH += bestY;
      } else {
        nextY += bestY;
      }
    }

    if (nextW < MIN_SIZE) {
      if (hasLeft) nextX = start.x + start.width - MIN_SIZE;
      nextW = MIN_SIZE;
    }
    if (nextH < MIN_SIZE) {
      if (hasTop) nextY = start.y + start.height - MIN_SIZE;
      nextH = MIN_SIZE;
    }

    return { x: nextX, y: nextY, width: nextW, height: nextH };
  }

  private getSnapCandidates(excluded: Set<BaseNode>): Array<{ x: number; y: number; width: number; height: number }> {
    const seed = Array.from(this.selectedNodes)[0];
    const parent = seed?.parent as Container | null;
    if (!parent) return [];

    const nodes = parent.children.filter((child): child is BaseNode => child instanceof BaseNode);
    const candidates = nodes
      .filter((node) => !excluded.has(node))
      .map((node) => this.getNodeBoundsInParentSpace(node))
      .filter((b) => Number.isFinite(b.x) && Number.isFinite(b.y) && b.width > 0 && b.height > 0);

    // Include the nearest ancestor frame boundary as a snap target so children can snap to frame edges.
    const ancestorFrame = this.findNearestAncestorFrame(seed ?? null);
    if (ancestorFrame) {
      const frameBounds = this.getContainerBoundsInTargetSpace(ancestorFrame, parent);
      if (
        Number.isFinite(frameBounds.x) &&
        Number.isFinite(frameBounds.y) &&
        frameBounds.width > 0 &&
        frameBounds.height > 0
      ) {
        candidates.push(frameBounds);
      }
    }

    return candidates;
  }

  private findNearestAncestorFrame(node: BaseNode | null): FrameNode | null {
    let current = node?.parent as Container | null;
    while (current) {
      if (current instanceof FrameNode) return current;
      current = current.parent;
    }
    return null;
  }

  private getContainerBoundsInTargetSpace(
    container: Container,
    target: Container
  ): { x: number; y: number; width: number; height: number } {
    if (container === target) {
      return { x: 0, y: 0, width: container.width, height: container.height };
    }
    const b = container.getBounds();
    const tl = target.toLocal(new Point(b.x, b.y));
    const br = target.toLocal(new Point(b.x + b.width, b.y + b.height));
    return {
      x: Math.min(tl.x, br.x),
      y: Math.min(tl.y, br.y),
      width: Math.abs(br.x - tl.x),
      height: Math.abs(br.y - tl.y),
    };
  }

  private getNodeBoundsInParentSpace(node: BaseNode): { x: number; y: number; width: number; height: number } {
    const parent = node.parent as Container | null;
    const b = node.getBounds();
    if (!parent) return { x: b.x, y: b.y, width: b.width, height: b.height };
    const tl = parent.toLocal(new Point(b.x, b.y));
    const br = parent.toLocal(new Point(b.x + b.width, b.y + b.height));
    const x = Math.min(tl.x, br.x);
    const y = Math.min(tl.y, br.y);
    return {
      x,
      y,
      width: Math.abs(br.x - tl.x),
      height: Math.abs(br.y - tl.y),
    };
  }

  private captureNodeWorldTransform(node: BaseNode): { origin: Point; xAxis: Point; yAxis: Point } {
    return {
      origin: node.toGlobal(new Point(0, 0)),
      xAxis: node.toGlobal(new Point(1, 0)),
      yAxis: node.toGlobal(new Point(0, 1)),
    };
  }

  private applyWorldTransformToParent(
    node: BaseNode,
    parent: Container,
    transform: { origin: Point; xAxis: Point; yAxis: Point }
  ) {
    const origin = parent.toLocal(transform.origin);
    const xAxis = parent.toLocal(transform.xAxis);
    const yAxis = parent.toLocal(transform.yAxis);
    const xVector = new Point(xAxis.x - origin.x, xAxis.y - origin.y);
    const yVector = new Point(yAxis.x - origin.x, yAxis.y - origin.y);
    const scaleX = Math.hypot(xVector.x, xVector.y) || 1;
    const scaleY = Math.hypot(yVector.x, yVector.y) || 1;
    const rotation = Math.atan2(xVector.y, xVector.x);

    node.position.copyFrom(origin);
    node.rotation = rotation;
    node.scale.set(scaleX, scaleY);
  }

  private getNodeBoundsInSelectionSpace(node: BaseNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const parent = this.selectionGraphics.parent as Container | null;
    const b = node.getBounds();
    if (!parent) return { x: b.x, y: b.y, width: b.width, height: b.height };
    const tl = parent.toLocal(new Point(b.x, b.y));
    const br = parent.toLocal(new Point(b.x + b.width, b.y + b.height));
    return {
      x: Math.min(tl.x, br.x),
      y: Math.min(tl.y, br.y),
      width: Math.abs(br.x - tl.x),
      height: Math.abs(br.y - tl.y),
    };
  }

  private getLineEndpointsInSelectionSpace(lineNode: LineNode) {
    const startGlobal = lineNode.parent
      ? lineNode.parent.toGlobal(new Point(lineNode.x + lineNode.startX, lineNode.y + lineNode.startY))
      : new Point(lineNode.x + lineNode.startX, lineNode.y + lineNode.startY);
    const endGlobal = lineNode.parent
      ? lineNode.parent.toGlobal(new Point(lineNode.x + lineNode.endX, lineNode.y + lineNode.endY))
      : new Point(lineNode.x + lineNode.endX, lineNode.y + lineNode.endY);

    const parent = this.selectionGraphics.parent as Container | null;
    if (!parent) {
      return { startX: startGlobal.x, startY: startGlobal.y, endX: endGlobal.x, endY: endGlobal.y };
    }

    const start = parent.toLocal(startGlobal);
    const end = parent.toLocal(endGlobal);
    return { startX: start.x, startY: start.y, endX: end.x, endY: end.y };
  }

  private getSelectedBoundsInParentSpace(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    this.selectedNodes.forEach((node) => {
      const b = this.getNodeBoundsInParentSpace(node);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private updateSingleResizeTransform(point: Point) {
    const state = this.singleResizeTransform;
    if (!state) return;

    const delta = this.getDeltaInParentSpace(state.node.parent as Container | null, state.startPoint, point);
    const dx = delta.x;
    const dy = delta.y;
    const start = state.startState;
    const handle = state.handle;
    const MIN_SIZE = 10;

    const rightEdge = start.x + start.width;
    const bottomEdge = start.y + start.height;
    const centerX = start.x + start.width / 2;
    const centerY = start.y + start.height / 2;

    let nextW = start.width;
    let nextH = start.height;
    let nextX = start.x;
    let nextY = start.y;

    const hasLeft = handle.includes('left');
    const hasRight = handle.includes('right');
    const hasTop = handle.includes('top');
    const hasBottom = handle.includes('bottom');

    if (hasRight) nextW = start.width + dx;
    if (hasLeft) {
      nextW = start.width - dx;
      nextX = start.x + dx;
    }
    if (hasBottom) nextH = start.height + dy;
    if (hasTop) {
      nextH = start.height - dy;
      nextY = start.y + dy;
    }

    if (this.shiftKey) {
      const ratio = start.width / Math.max(1, start.height);
      const hasHorizontal = hasLeft || hasRight;
      const hasVertical = hasTop || hasBottom;

      if (hasHorizontal && hasVertical) {
        const targetW = Math.max(MIN_SIZE, nextW);
        const targetH = Math.max(MIN_SIZE, nextH);
        if (Math.abs(targetW / ratio - targetH) > Math.abs(targetH * ratio - targetW)) {
          nextH = targetW / ratio;
        } else {
          nextW = targetH * ratio;
        }
        if (hasLeft) nextX = rightEdge - nextW;
        if (hasTop) nextY = bottomEdge - nextH;
      } else if (hasHorizontal) {
        nextH = nextW / ratio;
        nextY = centerY - nextH / 2;
      } else if (hasVertical) {
        nextW = nextH * ratio;
        nextX = centerX - nextW / 2;
      }
    }

    if (nextW < MIN_SIZE) {
      nextW = MIN_SIZE;
      if (hasLeft) nextX = rightEdge - nextW;
    }
    if (nextH < MIN_SIZE) {
      nextH = MIN_SIZE;
      if (hasTop) nextY = bottomEdge - nextH;
    }

    if (this.objectSnapEnabled) {
      const snapped = this.getSnappedResizeRect(
        { x: nextX, y: nextY, width: nextW, height: nextH },
        handle,
        { x: start.x, y: start.y, width: start.width, height: start.height },
        new Set([state.node])
      );
      nextX = snapped.x;
      nextY = snapped.y;
      nextW = snapped.width;
      nextH = snapped.height;
    }

    state.node.width = Math.max(1, Math.round(nextW));
    state.node.height = Math.max(1, Math.round(nextH));
    state.node.position.set(Math.round(nextX), Math.round(nextY));
  }

  private getDeltaInParentSpace(parent: Container | null, startPoint: Point, point: Point): Point {
    if (!parent) {
      return new Point(point.x - startPoint.x, point.y - startPoint.y);
    }
    const startLocal = parent.toLocal(startPoint);
    const currentLocal = parent.toLocal(point);
    return new Point(currentLocal.x - startLocal.x, currentLocal.y - startLocal.y);
  }
}
