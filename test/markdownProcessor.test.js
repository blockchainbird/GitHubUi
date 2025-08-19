/**
 * Tests for the processTermReferences function with markdown processing
 */

import { processTermReferences } from '../src/utils/editorUtils.js'

describe('processTermReferences - Markdown Processing', () => {
  test('should process markdown headings correctly', () => {
    const input = `# Main Title
## Section Header
### Subsection
#### Subsubsection
##### Fifth Level
###### Sixth Level`

    const result = processTermReferences(input, [])

    expect(result).toContain('<h1>Main Title</h1>')
    expect(result).toContain('<h2>Section Header</h2>')
    expect(result).toContain('<h3>Subsection</h3>')
    expect(result).toContain('<h4>Subsubsection</h4>')
    expect(result).toContain('<h5>Fifth Level</h5>')
    expect(result).toContain('<h6>Sixth Level</h6>')
  })

  test('should process basic markdown formatting', () => {
    const input = `This is **bold** text and *italic* text and _also italic_ and \`code\` blocks.`

    const result = processTermReferences(input, [])

    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
    expect(result).toContain('<em>also italic</em>')
    expect(result).toContain('<code>code</code>')
  })

  test('should process basic links', () => {
    const input = `Check out [this link](https://example.com) for more info.`

    const result = processTermReferences(input, [])

    expect(result).toContain('<a href="https://example.com">this link</a>')
  })

  test('should wrap regular text in paragraph tags', () => {
    const input = `This is a regular paragraph of text.`

    const result = processTermReferences(input, [])

    expect(result).toContain('<p>This is a regular paragraph of text.</p>')
  })

  test('should handle mixed content correctly', () => {
    const input = `# Document Title

This is a **bold** paragraph with some content.

## Section Two

Another paragraph with [a link](https://example.com) and \`code\`.`

    const result = processTermReferences(input, [])

    expect(result).toContain('<h1>Document Title</h1>')
    expect(result).toContain('<h2>Section Two</h2>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<a href="https://example.com">a link</a>')
    expect(result).toContain('<code>code</code>')
  })

  test('should still process term references alongside markdown', () => {
    const input = `# Document Title

Here is a definition:

[[def: example-term, alias1, alias2]]

~ This is a definition paragraph.

## References

See [[ref: example-term]] for more details.`

    const terms = [{
      id: 'example-term',
      definitionText: 'This is an example term',
      external: false
    }]

    const result = processTermReferences(input, terms)

    expect(result).toContain('<h1>Document Title</h1>')
    expect(result).toContain('<h2>References</h2>')
    expect(result).toContain('definition-term-name')
    expect(result).toContain('definition-paragraph')
    expect(result).toContain('term-reference local')
  })
})
