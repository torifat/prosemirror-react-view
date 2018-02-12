import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Clock from 'react-clock';

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
        return this.props.children;
      }
    },
  },

  clock: {
    group: 'block',
    attrs: {
      initialDate: { default: new Date() },
    },
    toReact: class MyApp extends Component {
      constructor(props) {
        super(props);
        this.state = {
          date: this.props.initialDate,
        };
      }

      componentDidMount() {
        const tick = 1000; //ms
        setInterval(() => {
          const { date } = this.state;
          const newDate = new Date(date.getTime() + tick);
          this.setState({ date: newDate });
        }, tick);
      }

      render() {
        return (
          <div contentEditable={false} style={{ margin: '20px 0' }}>
            <Clock value={this.state.date} />
          </div>
        );
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
