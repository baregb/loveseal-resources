import { Node, mergeAttributes, type RawCommands } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scripture: {
      setScripture: (attrs: { reference: string; text?: string }) => ReturnType
    }
  }
}

export const Scripture = Node.create({
  name: 'scripture',
  group: 'block',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      reference: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-reference') ?? '',
        renderHTML: (attrs: { reference: string }) => ({ 'data-reference': attrs.reference }),
      },
    }
  },

  content: 'text*',

  parseHTML() {
    return [{ tag: 'blockquote[data-scripture="true"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'blockquote',
      mergeAttributes(HTMLAttributes, {
        'data-scripture': 'true',
        'class':          'scripture-callout',
      }),
      ['span', { class: 'scripture-ref' }, node.attrs.reference || 'Scripture'],
      ['span', { class: 'scripture-text' }, 0],
    ]
  },

  addCommands() {
    return {
      setScripture:
        (attrs: { reference: string; text?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { reference: attrs.reference },
            content: attrs.text ? [{ type: 'text', text: attrs.text }] : undefined,
          })
        },
    } as Partial<RawCommands>
  },
})
