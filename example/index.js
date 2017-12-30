import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { EditorView } from '../src';
import docJs from './doc';

const nodes = {
  doc: {
    content: 'block+',
    toReact: null,
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    toReact: class Paragraph extends Component {
      render() {
        return <p>{this.props.children}</p>;
      }
    },
  },

  text: {
    group: 'inline',
    toReact: class Text extends Component {
      render() {
        return this.porps.children;
      }
    },
  },
};

const marks = {
  link: {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    toReact: class Link extends Component {
      render() {
        const { href, children } = this.props;
        return <a href={href}>{children}</a>;
      }
    },
  },

  em: {
    toReact: class Em extends Component {
      render() {
        return <em>{this.props.children}</em>;
      }
    },
  },

  strong: {
    toReact: class Strong extends Component {
      render() {
        return <strong>{this.props.children}</strong>;
      }
    },
  },
};

export const schema = new Schema({ nodes, marks });
const doc = schema.nodeFromJSON(docJs);

const state = EditorState.create({
  schema,
  doc,
  plugins: [keymap(baseKeymap)],
});

ReactDOM.render(<EditorView state={state} />, document.getElementById('app'));
