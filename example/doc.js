export default {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'hello' },
        { type: 'text', text: '!', marks: [{ type: 'strong' }] },
      ],
    },
    {
      type: 'paragraph',
      content: [],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'click here',
          marks: [{ type: 'link', attrs: { href: 'www.google.com' } }],
        },
        { type: 'text', text: ' for more', marks: [{ type: 'em' }] },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'foo', marks: [{ type: 'strong' }] },
        { type: 'text', text: ' ' },
        {
          type: 'text',
          text: 'bar',
          marks: [{ type: 'strong' }, { type: 'em' }],
        },
      ],
    },
  ],
};
