import React, { Component } from 'react';
import ReactDOM from 'react-dom';

let selectionParent = null;

// nodeToReactElement :: Node<Attributes> -> ReactElement<Props>
const nodeToReactElement = (node, depth, selection) =>
  node.content.content.map((child, idx) => {
    if (child.isBlock) {
      const updateRef = selection.$head.parent === child;
      const Block = child.type.spec.toReact;
      const children =
        child.content.size === 0 ? (
          <br />
        ) : (
          nodeToReactElement(child, depth + 1)
        );
      return (
        <Block
          ref={ref => (selectionParent = updateRef ? ref : selectionParent)}
          key={`p-${depth}-${idx}`}
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
          <Mark key={key} {...attrs}>
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
        suppressContentEditableWarning
      >
        {nodeToReactElement(editorState.doc, 0, editorState.selection)}
      </div>
    );
  }

  componentWillUnmount() {
    this.listeners = [];
  }

  dispatch = tr => {
    const { editorState } = this.state;
    const newState = editorState.apply(tr);
    this.setState({ editorState: newState }, () => {
      // console.log(newState.selection.$head.parentOffset);
      // console.log(ReactDOM.findDOMNode(selectionParent));
      if (selectionParent) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.setStart(
          ReactDOM.findDOMNode(selectionParent).firstChild,
          newState.selection.$head.parentOffset
        );
        selection.addRange(range);
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

    if (event.which === 13) {
      this.listeners.handleKeyDown.forEach(listener => {
        listener(
          {
            state: editorState,
            dispatch: this.dispatch,
          },
          event
        );
      });
    } else if (event.which >= 65 && event.which <= 90) {
      const tr = editorState.tr.insertText(event.key);
      this.dispatch(tr);
    }
    event.preventDefault();
  };

  onKeyPress = event => {
    // console.log('KeyPress', event.key);
    event.preventDefault();
  };

  onKeyUp = event => {
    // console.log('KeyUp', event.key);
    event.preventDefault();
  };
}
