/**
 * Simple verification script for the markdown processor
 * Run this in the browser console to test the functionality
 */

// Import the function (for testing in the app context)
// import { processTermReferences } from './src/utils/editorUtils.js'

// Test cases to verify markdown processing works correctly
const testCases = [
  {
    name: 'Basic headings',
    input: '# Main Title\n## Subtitle\n### Section',
    expectedIncludes: ['<h1>Main Title</h1>', '<h2>Subtitle</h2>', '<h3>Section</h3>']
  },
  {
    name: 'Text formatting',
    input: 'This is **bold** and *italic* and `code`',
    expectedIncludes: ['<strong>bold</strong>', '<em>italic</em>', '<code>code</code>']
  },
  {
    name: 'Links',
    input: 'Check [this link](https://example.com)',
    expectedIncludes: ['<a href="https://example.com">this link</a>']
  },
  {
    name: 'Mixed content',
    input: '# Title\n\nThis is **bold** text.\n\n## Section\n\nMore content here.',
    expectedIncludes: ['<h1>Title</h1>', '<h2>Section</h2>', '<strong>bold</strong>']
  }
]

function testMarkdownProcessor() {
  console.log('Testing markdown processor...')
  
  if (typeof processTermReferences === 'undefined') {
    console.error('processTermReferences function not available. Run this in the app context.')
    return
  }
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`)
    console.log('Input:', testCase.input)
    
    const result = processTermReferences(testCase.input, [])
    console.log('Output:', result)
    
    const passed = testCase.expectedIncludes.every(expected => result.includes(expected))
    console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
    
    if (!passed) {
      console.log('Expected to include:', testCase.expectedIncludes)
      testCase.expectedIncludes.forEach(expected => {
        if (!result.includes(expected)) {
          console.log(`❌ Missing: ${expected}`)
        }
      })
    }
  })
  
  console.log('\nTesting complete!')
}

// Export for use in browser console
window.testMarkdownProcessor = testMarkdownProcessor

console.log('Markdown processor test utility loaded. Call testMarkdownProcessor() to run tests.')
