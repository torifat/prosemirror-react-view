const applySelection = (dom, anchor, head) => {
  const domSel = document.getSelection();
  const range = document.createRange();
  range.setEnd(dom, head);
  range.setStart(dom, anchor);
  domSel.removeAllRanges();
  domSel.addRange(range);
};

const findLocalDomPosition = (pos, pmViewDesc) => {
  if (pmViewDesc.node.isLeaf) {
    return { dom: pmViewDesc.dom, offset: 0 };
  }

  for (let offset = 0, i = 0; ; i++) {
    if (offset == pos) {
      while (i < pmViewDesc.children.length) i++; //&& this.children[i].beforePosition
      return { dom: pmViewDesc.dom, offset: i };
    }
    if (i == pmViewDesc.children.length)
      throw new Error('Invalid position ' + pos);
    let child = pmViewDesc.children[i],
      end = offset + child.node.content.size;
    if (pos < end) return findLocalDomPosition(pos - offset - 0, child);
    offset = end;
  }
};

export const setSelection = (anchor, head, pmViewDesc) => {
  // If the selection falls entirely in a child, give it to that child
  const from = Math.min(anchor, head),
    to = Math.max(anchor, head);

  const { children, dom } = pmViewDesc;

  for (let i = 0, offset = 0; i < children.length; i++) {
    let child = children[i],
      end = offset + child.node.nodeSize; //child.node.content.size;
    if (from > offset && to < end) {
      return setSelection(
        anchor - offset - (child.node.isText ? 0 : 1), //child.border,
        head - offset - (child.node.isText ? 0 : 1), //child.border,
        child
      );
    }

    offset = end;
  }

  console.log({
    anchor,
    dom,
    pmViewDesc,
    isText: pmViewDesc.node.isText,
  });

  if (dom) {
    applySelection(dom.nodeType === 1 ? dom.firstChild : dom, anchor, head);
  }
};
