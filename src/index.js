import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { TextSelection, Selection } from 'prosemirror-state';

import renderer from './renderer';
import { findStartPos, getPmViewDesc } from './helpers/pm-view-desc';
import { setSelection } from './helpers/selection';
import Keys from './keys';

export class EditorView extends Component {
  listeners = { handleKeyDown: [] };
  rootPmViewDesc = {};

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
    this.rootPmViewDesc = {
      node: editorState.doc,
      children: [],
    };

    return (
      <div
        ref={ref => (this.rootPmViewDesc.dom = ref)}
        contentEditable={true}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        onKeyUp={this.onKeyUp}
        onSelect={this.onSelect}
        suppressContentEditableWarning
      >
        {renderer(editorState.doc, 0, this.rootPmViewDesc)}
      </div>
    );
  }

  componentWillUnmount() {
    this.listeners = [];
  }

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(nextState.editorState.selection);
    return nextState.editorState.doc !== this.state.editorState.doc;
  }

  dispatch = (tr, ignoreSelection = false) => {
    const { editorState } = this.state;
    const newState = editorState.apply(tr);
    this.setState({ editorState: newState }, () => {
      if (!ignoreSelection) {
        const { anchor, head } = newState.selection;
        setSelection(anchor, head, this.rootPmViewDesc);
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
      case Keys.BACKSPACE:
        this.listeners.handleKeyDown.forEach(listener => {
          listener(
            {
              state: editorState,
              dispatch: this.dispatch,
              endOfTextblock: this.endOfTextblock,
            },
            event
          );
        });
        break;
      case Keys.LEFT:
      case Keys.RIGHT:
        const { selection } = editorState;
        if (selection instanceof TextSelection) {
          const dir = keyCode === Keys.LEFT ? -1 : 1;
          const sel = Selection.findFrom(selection.$head + dir, 0);
          const tr = editorState.tr.setSelection(sel);
          this.dispatch(tr);
        }
        event.preventDefault();
        break;
      default:
        if (
          (event.which >= Keys.A && event.which <= Keys.Z) ||
          event.which === Keys.SPACE
        ) {
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
    // +1 for doc(<--| start border |)
    const head =
      findStartPos(getPmViewDesc(domSel.anchorNode)) + domSel.anchorOffset + 1;
    const $head = editorState.doc.resolve(head);
    const sel = Selection.findFrom($head, 0);
    if (sel) {
      const tr = editorState.tr.setSelection(sel);
      this.dispatch(tr, true);
    }
  };

  endOfTextblock() {
    console.log('TODO: endOfTextblock');
  }
}
