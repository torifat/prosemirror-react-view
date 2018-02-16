// getPmViewDesc :: HTMLElement -> Object
export const getPmViewDesc = dom => {
  let pointer = dom;
  while (pointer && !pointer.pmViewDesc) {
    pointer = pointer.parentElement;
  }
  return (pointer && pointer.pmViewDesc) || {};
};

// findStartPos :: ViewDesc -> number
export const findStartPos = pmViewDesc =>
  pmViewDesc.parent ? findPosBeforeChild(pmViewDesc) : 0;

// findPosBeforeChild :: ViewDesc -> number
export const findPosBeforeChild = pmViewDesc => {
  const { node, parent, dom } = pmViewDesc;
  const { children } = parent;

  let pos = findStartPos(parent);
  for (let i = 0; i < children.length; i++) {
    const cur = children[i].node;
    if (cur === node) return pos;
    pos += cur.nodeSize;
  }
  return pos;
};
