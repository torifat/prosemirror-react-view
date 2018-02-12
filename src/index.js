import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { TextSelection, Selection } from 'prosemirror-state';

import Keys from './keys';

let selectionParent = null;

// nodeToReactElement :: Node<Attributes> -> ReactElement<Props>
const nodeToReactElement = (node, depth, selection) =>
  node.content.content.map((child, idx) => {
    if (child.isBlock) {
      const updateRef = selection.$head.parent === child;
      const Block = child.type.spec.toReact;
      const key = `${child.type.name}-${depth}-${idx}`;
      const { attrs } = child;
      const children =
        child.content.size === 0 ? (
          <br />
        ) : (
          nodeToReactElement(child, depth + 1)
        );
      return (
        <Block
          ref={ref => {
            // https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components
            const dom = ReactDOM.findDOMNode(ref);
            if (dom) {
              dom.pmViewDesc = {
                parent: node,
                node: child,
                // TODO: Clean up during componentWillUnmount otherwise will create memory leaks
                dom,
              };
            }
            // selectionParent = updateRef ? ref : selectionParent;
          }}
          key={key}
          {...attrs}
        >
          {children}
        </Block>
      );
    } else if (child.type.name === 'text') {
      return child.marks.reduce((text, mark, idx) => {
        const Mark = mark.type.spec.toReact;
        const key = `${mark.type.name}-${depth}-${idx}`;
        const { attrs } = mark;
        return (
          <Mark
            ref={ref => {
              // https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components
              const dom = ReactDOM.findDOMNode(ref);
              if (dom) {
                dom.pmViewDesc = {
                  parent: node,
                  node: child,
                  // TODO: Clean up during componentWillUnmount otherwise will create memory leaks
                  dom,
                };
              }
            }}
            key={key}
            {...attrs}
          >
            {text}
          </Mark>
        );
      }, child.text);
    } else {
      throw new Error(`${child.type.name} is not defined!`);
    }
  });

export class EditorView extends Component {
  listeners = { handleKeyDown: [] };

  state = {
    editorState: this.props.state,
  };

  constructor(props) {
    super(props);
    const { state } = this.props;
    state.plugins.map(({ props }) => {
      if (props.handleKeyDown) {
        this.listeners.handleKeyDown.push(props.handleKeyDown);
      }
    });
  }

  render() {
    const { editorState } = this.state;
    return (
      <div
        ref={ref => (this.editorContainer = ref)}
        contentEditable={true}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        onKeyUp={this.onKeyUp}
        onSelect={this.onSelect}
        suppressContentEditableWarning
      >
        {nodeToReactElement(editorState.doc, 0, editorState.selection)}
      </div>
    );
  }

  componentWillUnmount() {
    this.listeners = [];
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log(nextState.editorState.selection);
    return nextState.editorState.doc !== this.state.editorState.doc;
  }

  dispatch = (tr, ignoreSelection = false) => {
    const { editorState } = this.state;
    const newState = editorState.apply(tr);
    this.setState({ editorState: newState }, () => {
      if (selectionParent && !ignoreSelection) {
        // const selection = window.getSelection();
        // selection.removeAllRanges();
        // const range = document.createRange();
        // range.setStart(
        //   ReactDOM.findDOMNode(selectionParent).firstChild,
        //   newState.selection.$head.parentOffset
        // );
        // selection.addRange(range);
        // selectionParent = null;
      }
    });
  };

  onKeyDown = event => {
    const { editorState } = this.state;
    console.groupCollapsed('%cKeyDown', 'color: green');
    ['key', 'which', 'target', 'metaKey', 'ctrlKey', 'shiftKey'].forEach(
      key => {
        console.log(key, '→', event[key]);
      }
    );
    console.groupEnd('KeyDown');

    if (event.metaKey || event.ctrlKey) {
      return;
    }

    const keyCode = event.which;

    switch (keyCode) {
      case Keys.RETURN:
        this.listeners.handleKeyDown.forEach(listener => {
          listener(
            {
              state: editorState,
              dispatch: this.dispatch,
            },
            event
          );
        });
        break;
      case Keys.LEFT:
        const { selection } = editorState;
        if (selection instanceof TextSelection) {
          const sel = Selection.near(selection.$head, -1);
          const tr = editorState.tr.setSelection(sel);
          this.dispatch(tr);
        }
        event.preventDefault();
        break;
      default:
        if (event.which >= 65 && event.which <= 90) {
          const tr = editorState.tr.insertText(event.key);
          this.dispatch(tr);
        }
        event.preventDefault();
    }
  };

  onKeyPress = event => {
    // console.log('KeyPress', event.key);
    event.preventDefault();
  };

  onKeyUp = event => {
    // console.log('KeyUp', event.key);
    event.preventDefault();
  };

  onSelect = event => {
    const { editorState } = this.state;
    const domSel = window.getSelection();
    // TODO: Find why we need +1
    const head =
      findStartPos(getPmViewDesc(domSel.anchorNode)) + domSel.anchorOffset + 1;
    console.log(head);
    const $head = editorState.doc.resolve(head);
    const sel = Selection.findFrom($head, 0);
    // const selection = TextSelection.create(
    //   editorState.doc,
    //   domSel.anchorOffset
    // );
    // console.log(sel);
    const tr = editorState.tr.setSelection(sel);
    this.dispatch(tr, true);
  };
}

function getPmViewDesc(dom) {
  let pointer = dom;
  while (!pointer.pmViewDesc) {
    pointer = pointer.parentElement;
    if (!pointer) break;
  }
  return (pointer && pointer.pmViewDesc) || {};
}

function findStartPos(pmViewDesc) {
  return pmViewDesc.parent ? findPosBeforeChild(pmViewDesc) : 0;
}

function findPosBeforeChild(pmViewDesc) {
  const { node, parent, dom } = pmViewDesc;

  // console.log(
  //   'getPmViewDesc',
  //   dom,
  //   dom.parentElement,
  //   getPmViewDesc(dom.parentElement)
  // );

  const children = parent.content.content;
  for (
    let i = 0, pos = findStartPos(getPmViewDesc(dom.parentElement));
    i < children.length;
    i++
  ) {
    const cur = children[i];
    if (cur === node) return pos;
    pos += cur.nodeSize;
  }
}
