import React, { Component } from 'react';
import ReactDOM from 'react-dom';

const assignDomToPmViewDesc = pmViewDesc => ref => {
  // https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components
  const dom = ReactDOM.findDOMNode(ref);
  if (dom) {
    pmViewDesc.dom = dom;
    // TODO: Clean up during componentWillUnmount otherwise will create memory leaks
    dom.pmViewDesc = pmViewDesc;
  }
};

// nodeToReactElement :: Node<Attributes> -> ReactElement<Props>
const nodeToReactElement = (node, depth, parentPmViewDesc) =>
  node.content.content.map((child, idx) => {
    if (child.isBlock) {
      const Block = child.type.spec.toReact;
      const key = `${child.type.name}-${depth}-${idx}`;
      const { attrs } = child;
      const pmViewDesc = {
        node: child,
        parent: parentPmViewDesc,
        children: [],
      };
      parentPmViewDesc.children.push(pmViewDesc);

      const children =
        child.content.size === 0 ? (
          <br />
        ) : (
          nodeToReactElement(child, depth + 1, pmViewDesc)
        );

      return (
        <Block ref={assignDomToPmViewDesc(pmViewDesc)} key={key} {...attrs}>
          {children}
        </Block>
      );
    } else if (child.type.name === 'text') {
      if (child.marks.length === 0) {
        const Text = child.type.spec.toReact;
        const key = `${child.type.name}-${depth}-${idx}`;
        const pmViewDesc = {
          node: child,
          parent: parentPmViewDesc,
          children: [],
        };
        parentPmViewDesc.children.push(pmViewDesc);

        return (
          <Text ref={assignDomToPmViewDesc(pmViewDesc)} key={key}>
            {child.text}
          </Text>
        );
      }

      return child.marks.reduce((text, mark, idx) => {
        const Mark = mark.type.spec.toReact;
        const key = `${mark.type.name}-${depth}-${idx}`;
        const { attrs } = mark;
        const pmViewDesc = {
          node: child,
          parent: parentPmViewDesc,
          children: [],
        };
        parentPmViewDesc.children.push(pmViewDesc);

        return (
          <Mark ref={assignDomToPmViewDesc(pmViewDesc)} key={key} {...attrs}>
            {text}
          </Mark>
        );
      }, child.text);
    } else {
      throw new Error(`${child.type.name} is not defined!`);
    }
  });

export default nodeToReactElement;
