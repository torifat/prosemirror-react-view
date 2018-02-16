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
        if (
          (event.which >= Keys.A && event.which <= Keys.Z) ||
          (event.which >= Keys.ZERO && event.which <= Keys.NINE) ||
          // :) <
          (event.which === 186 || event.which === 48 || event.which === 188) ||
          event.which === Keys.SPACE
        ) {
          const { from, to } = editorState.selection;
          const handled = this.listeners.handleTextInput.some(listener =>
            listener(
              {
                state: editorState,
                dispatch: this.dispatch,
              },
              from,
              to,
              event.key
            )
          );

          if (!handled) {
            const tr = editorState.tr.insertText(event.key, from, to);
            this.dispatch(tr);
          }
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
    const tr = editorState.tr.setSelection(getCurrentSelection(editorState));
    this.dispatch(tr, true);
  };

  endOfTextblock() {
    console.log('TODO: endOfTextblock');
  }
}
