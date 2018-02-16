import { Selection } from 'prosemirror-state';
import { findStartPos, getPmViewDesc } from './pm-view-desc';

// applySelection :: HTMLElement -> number -> number -> void
const applySelection = (dom, anchor, head) => {
  const domSel = document.getSelection();
  const range = document.createRange();
  range.setEnd(dom, head);
  range.setStart(dom, anchor);
  domSel.removeAllRanges();
  domSel.addRange(range);
};

// setSelection :: number -> number -> ViewDesc -> void
export const setSelection = (anchor, head, pmViewDesc) => {
  // If the selection falls entirely in a child, give it to that child
  const from = Math.min(anchor, head),
    to = Math.max(anchor, head);

  const { children, dom } = pmViewDesc;

  for (let i = 0, offset = 0; i < children.length; i++) {
    let child = children[i],
      end = offset + child.node.nodeSize; // child.node.content.size;
    // NOTE: Change `< end` to `<=`, to fix typing at the end
    if (from > offset && to <= end) {
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

// findPosFromDom :: _ -> number
export const findPosFromDom = () => {
  const domSel = window.getSelection();
  // +1 for doc(<--| start border |)
  return (
    findStartPos(getPmViewDesc(domSel.anchorNode)) + domSel.anchorOffset + 1
  );
};

// getCurrentSelection :: State -> Selection
export const getCurrentSelection = editorState => {
  const head = findPosFromDom();
  const $head = editorState.doc.resolve(head);
  return Selection.findFrom($head, 0);
};
