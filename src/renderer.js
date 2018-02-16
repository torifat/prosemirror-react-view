import React, { Component, createElement } from 'react';
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

const equalSubTree = (lTree, rTree) => {
  if (lTree !== rTree) {
    return false;
  }

  if (lTree.content.size !== rTree.content.size) {
    return false;
  }

  const lLength = lTree.content.content.length;
  if (lLength !== rTree.content.content.length) {
    return false;
  }

  // zip + every :(
  let isEqual = true;
  for (let i = 0; i < lLength; ++i) {
    isEqual =
      isEqual &&
      equalSubTree(lTree.content.content[i], rTree.content.content[i]);
  }

  return isEqual;
};

const smartRender = WrappedComponent => {
  class WrapperComponent extends Component {
    // shouldComponentUpdate(nextProps) {
    //   if (this.props.node) {
    //     return !equalSubTree(this.props.node, nextProps.node);
    //   }
    //   return true;
    // }

    render() {
      return createElement(WrappedComponent, this.props);
    }
  }
  WrapperComponent.displayName = `SmartRendered(${WrappedComponent.name})`;
  return WrapperComponent;
};

const componentCache = {};
const getComponent = child => {
  const { name, spec } = child.type;
  if (!componentCache[name]) {
    componentCache[name] = smartRender(spec.toReact);
  }
  return componentCache[name];
};

// nodeToReactElement :: Node<Attributes> -> ReactElement<Props>
const nodeToReactElement = (node, depth, parentPmViewDesc) =>
  node.content.content.map((child, idx) => {
    if (child.isBlock) {
      const Block = getComponent(child);
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
        <Block
          node={child}
          ref={assignDomToPmViewDesc(pmViewDesc)}
          key={key}
          {...attrs}
        >
          {children}
        </Block>
      );
    } else if (child.type.name === 'text') {
      if (child.marks.length === 0) {
        const Text = getComponent(child);
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
        const Mark = getComponent(mark);
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
