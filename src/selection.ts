import { NodeType, Node as ProsemirrorNode, ResolvedPos } from 'prosemirror-model';
import { equalNodeType, isNodeSelection } from './helpers';
import { NodeSelection, Selection, Transaction } from 'prosemirror-state';

export type Predicate = (node: ProsemirrorNode) => boolean;

// :: (predicate: (node: ProseMirrorNode) → boolean) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
// Iterates over parent nodes, returning the closest node and its start position `predicate` returns truthy for. `start` points to the start position of the node, `pos` points directly before the node.
//
// ```javascript
// const predicate = node => node.type === schema.nodes.blockquote;
// const parent = findParentNode(predicate)(selection);
// ```

export type ContentNodeWithPos = {pos: number, start: number, depth: number, node: ProsemirrorNode};
export type NodeWithPos = {pos: number, node: ProsemirrorNode};

export type CellTransform = (cell: ContentNodeWithPos, tr: Transaction) => Transaction;

export type MovementOptions = { tryToFit: boolean, direction?: -1 | 0 | 1 };


export function findParentNode(predicate: Predicate): (selection: Selection) => ContentNodeWithPos | undefined
{
  return ({ $from }) => findParentNodeClosestToPos($from, predicate);
}

  

// :: ($pos: ResolvedPos, predicate: (node: ProseMirrorNode) → boolean) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
// Iterates over parent nodes starting from the given `$pos`, returning the closest node and its start position `predicate` returns truthy for. `start` points to the start position of the node, `pos` points directly before the node.
//
// ```javascript
// const predicate = node => node.type === schema.nodes.blockquote;
// const parent = findParentNodeClosestToPos(state.doc.resolve(5), predicate);
// ```



export function findParentNodeClosestToPos($pos: ResolvedPos, predicate: Predicate): ContentNodeWithPos | undefined
{
  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i);
    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node
      };
    }
  }
}

export type DomAtPos = (pos: number) => {node: Node, offset: number};

// :: (predicate: (node: ProseMirrorNode) → boolean, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → (selection: Selection) → ?dom.Node
// Iterates over parent nodes, returning DOM reference of the closest node `predicate` returns truthy for.
//
// ```javascript
// const domAtPos = view.domAtPos.bind(view);
// const predicate = node => node.type === schema.nodes.table;
// const parent = findParentDomRef(predicate, domAtPos)(selection); // <table>
// ```
export function findParentDomRef(predicate: Predicate, domAtPos: DomAtPos): (selection: Selection) => Node | undefined
{
  return (selection) =>{
    const parent = findParentNode(predicate)(selection);
    if (parent) {
      return findDomRefAtPos(parent.pos, domAtPos);
    }  
  }
}

// :: (predicate: (node: ProseMirrorNode) → boolean) → (selection: Selection) → boolean
// Checks if there's a parent node `predicate` returns truthy for.
//
// ```javascript
// if (hasParentNode(node => node.type === schema.nodes.table)(selection)) {
//   // ....
// }
// ```
export function hasParentNode(predicate: Predicate): (selection: Selection) => boolean
{ 
  return (selection) => {
    return !!findParentNode(predicate)(selection);
  }
}

// :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
// Iterates over parent nodes, returning closest node of a given `nodeType`. `start` points to the start position of the node, `pos` points directly before the node.
//
// ```javascript
// const parent = findParentNodeOfType(schema.nodes.paragraph)(selection);
// ```
export function findParentNodeOfType(nodeType: NodeType | NodeType[]): (selection: Selection) => ContentNodeWithPos | undefined
{ 
  return (selection) => {
    return findParentNode(node => equalNodeType(nodeType, node))(selection);
  };
}

// :: ($pos: ResolvedPos, nodeType: union<NodeType, [NodeType]>) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
// Iterates over parent nodes starting from the given `$pos`, returning closest node of a given `nodeType`. `start` points to the start position of the node, `pos` points directly before the node.
//
// ```javascript
// const parent = findParentNodeOfTypeClosestToPos(state.doc.resolve(10), schema.nodes.paragraph);
// ```
export function findParentNodeOfTypeClosestToPos($pos: ResolvedPos, nodeType: NodeType | NodeType[]): ContentNodeWithPos | undefined
{
  return findParentNodeClosestToPos($pos, node =>
    equalNodeType(nodeType, node)
  );
}

// :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → boolean
// Checks if there's a parent node of a given `nodeType`.
//
// ```javascript
// if (hasParentNodeOfType(schema.nodes.table)(selection)) {
//   // ....
// }
// ```
export function hasParentNodeOfType(nodeType: NodeType | NodeType[]): (selection: Selection) => boolean
{ return (selection) => {
    return hasParentNode(node => equalNodeType(nodeType, node))(selection);
  }
}

// :: (nodeType: union<NodeType, [NodeType]>, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → (selection: Selection) → ?dom.Node
// Iterates over parent nodes, returning DOM reference of the closest node of a given `nodeType`.
//
// ```javascript
// const domAtPos = view.domAtPos.bind(view);
// const parent = findParentDomRefOfType(schema.nodes.codeBlock, domAtPos)(selection); // <pre>
// ```
export function findParentDomRefOfType(nodeType: NodeType | NodeType[], domAtPos: DomAtPos): (selection: Selection) => Node | undefined
{ 
  return (selection) => {
    return findParentDomRef(node => equalNodeType(nodeType, node), domAtPos)(
      selection
    );
    }
}
// :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
// Returns a node of a given `nodeType` if it is selected. `start` points to the start position of the node, `pos` points directly before the node.
//
// ```javascript
// const { extension, inlineExtension, bodiedExtension } = schema.nodes;
// const selectedNode = findSelectedNodeOfType([
//   extension,
//   inlineExtension,
//   bodiedExtension,
// ])(selection);
// ```
export function findSelectedNodeOfType(nodeType: NodeType | NodeType[]): (selection: NodeSelection) => ContentNodeWithPos | undefined
{ 
  return (selection) => {    
      const { node, $from } = selection;
      if (equalNodeType(nodeType, node)) {
        return ({ node, pos: $from.pos, depth: $from.depth } as ContentNodeWithPos );
      }    
  }
}

// :: (selection: Selection) → ?number
// Returns position of the previous node.
//
// ```javascript
// const pos = findPositionOfNodeBefore(tr.selection);
// ```
export function findPositionOfNodeBefore(selection: Selection): number | undefined
{
  const { nodeBefore } = selection.$from;
  const maybeSelection = Selection.findFrom(selection.$from, -1);
  if (maybeSelection && nodeBefore) {
    // leaf node
    const parent = findParentNodeOfType(nodeBefore.type)(maybeSelection);
    if (parent) {
      return parent.pos;
    }
    return maybeSelection.$from.pos;
  }
}

// :: (position: number, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → dom.Node
// Returns DOM reference of a node at a given `position`. If the node type is of type `TEXT_NODE` it will return the reference of the parent node.
//
// ```javascript
// const domAtPos = view.domAtPos.bind(view);
// const ref = findDomRefAtPos($from.pos, domAtPos);
// ```
export function findDomRefAtPos(position: number, domAtPos: DomAtPos): Node
{
  const dom = domAtPos(position);
  const node = dom.node.childNodes[dom.offset];

  if (dom.node.nodeType === Node.TEXT_NODE) {
    return dom.node.parentNode;
  }

  if (!node || node.nodeType === Node.TEXT_NODE) {
    return dom.node;
  }

  return node;
}
