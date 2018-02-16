import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { TextSelection, Selection } from 'prosemirror-state';

import renderer from './renderer';
import {
  setSelection,
  getCurrentSelection,
  findPosFromDom,
} from './helpers/selection';
import Keys from './keys';

export class EditorView extends Component {
  listeners = { handleKeyDown: [], handleTextInput: [] };
  rootPmViewDesc = {};

  state = {
    editorState: this.props.state,
  };

  constructor(props) {
    super(props);
    const { state } = this.props;
    state.plugins.map(({ props }) => {
      Object.keys(this.listeners).forEach(key => {
        if (props[key] && this.listeners[key]) {
          this.listeners[key].push(props[key]);
        }
      });
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

    const { editorState } = this.state;
    const keyCode = event.which;

    switch (keyCode) {
      case Keys.RETURN:
      case Keys.BACKSPACE:
        event.preventDefault();
      case Keys.LEFT:
      case Keys.RIGHT:
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

      default:
    }
  };

  onKeyPress = event => {
    // console.log('KeyPress', event.key);
    if (!event.charCode || (event.ctrlKey && !event.altKey)) {
      return;
    }

    const { editorState } = this.state;

    const { $from, $to } = editorState.selection;
    const text = String.fromCharCode(event.charCode);
    const handled = this.listeners.handleTextInput.some(listener =>
      listener(
        {
          state: editorState,
          dispatch: this.dispatch,
        },
        $from.pos,
        $to.pos,
        text
      )
    );

    if (!handled) {
      const tr = editorState.tr
        .insertText(text, $from.pos, $to.pos)
        .scrollIntoView();
      this.dispatch(tr);
    }

    event.preventDefault();
  };

  onKeyUp = event => {
    // console.log('KeyUp', event.key);
    event.preventDefault();
  };

  onSelect = event => {
    const { editorState } = this.state;
    const tr = editorState.tr.setSelection(getCurrentSelection(editorState));
    this.dispatch(tr, true);
  };

  endOfTextblock() {
    console.log('TODO: endOfTextblock');
  }
}
