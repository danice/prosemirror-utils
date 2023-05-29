import { Node as ProsemirrorNode, NodeType, Mark, MarkType, ResolvedPos, Fragment } from 'prosemirror-model';
import { NodeWithPos, Predicate } from 'prosemirror-utils-bangle/src/selection';

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Flattens descendants of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const children = flatten(node);
// ```
export function flatten(node: ProsemirrorNode, descend?: boolean): NodeWithPos[]
{
  if (!node) {
    throw new Error('Invalid "node" parameter');
  }
  const result = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    if (!descend) {
      return false;
    }
  });
  return result;
}

// :: (node: ProseMirrorNode, predicate: (node: ProseMirrorNode) → boolean, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Iterates over descendants of a given `node`, returning child nodes predicate returns truthy for. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const textNodes = findChildren(node, child => child.isText, false);
// ```
export function findChildren(node: ProsemirrorNode, predicate: Predicate, descend?: boolean): NodeWithPos[]
{
  if (!node) {
    throw new Error('Invalid "node" parameter');
  } else if (!predicate) {
    throw new Error('Invalid "predicate" parameter');
  }
  return flatten(node, descend).filter(child => predicate(child.node));
}

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Returns text nodes of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const textNodes = findTextNodes(node);
// ```
export function findTextNodes(node: ProsemirrorNode, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => child.isText, descend);
}

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Returns inline nodes of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const inlineNodes = findInlineNodes(node);
// ```
export function findInlineNodes(node: ProsemirrorNode, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => child.isInline, descend);
}

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Returns block descendants of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const blockNodes = findBlockNodes(node);
// ```
export function findBlockNodes(node: ProsemirrorNode, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => child.isBlock, descend);
}

// :: (node: ProseMirrorNode, predicate: (attrs: ?Object) → boolean, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Iterates over descendants of a given `node`, returning child nodes predicate returns truthy for. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const mergedCells = findChildrenByAttr(table, attrs => attrs.colspan === 2);
// ```
export function findChildrenByAttr(node: ProsemirrorNode, predicate: Predicate, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => !!predicate(child), descend);
}

// :: (node: ProseMirrorNode, nodeType: NodeType, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Iterates over descendants of a given `node`, returning child nodes of a given nodeType. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const cells = findChildrenByType(table, schema.nodes.tableCell);
// ```
export function findChildrenByType(node: ProsemirrorNode, nodeType: NodeType, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => child.type === nodeType, descend);
}

// :: (node: ProseMirrorNode, markType: markType, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Iterates over descendants of a given `node`, returning child nodes that have a mark of a given markType. It doesn't descend into a `node` when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const nodes = findChildrenByMark(state.doc, schema.marks.strong);
// ```
export function findChildrenByMark(node: ProsemirrorNode, markType: MarkType, descend?: boolean): NodeWithPos[]
{
  return findChildren(node, child => markType.isInSet(child.marks)!= null, descend);
}

// :: (node: ProseMirrorNode, nodeType: NodeType) → boolean
// Returns `true` if a given node contains nodes of a given `nodeType`
//
// ```javascript
// if (contains(panel, schema.nodes.listItem)) {
//   // ...
// }
// ```
export function contains(node: ProsemirrorNode, nodeType: NodeType): boolean
{
  return !!findChildrenByType(node, nodeType, null).length;
}
