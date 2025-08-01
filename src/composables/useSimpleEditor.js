/**
 * Composable for simple editor functionality
 * Handles the user-friendly terms editor interface
 */

import { ref, computed, nextTick } from 'vue'

export function useSimpleEditor() {
  // Simple editor state
  const simpleEditor = ref({
    termType: 'local',
    externalRepo: '',
    mainTerm: '',
    aliases: [null],
    definition: ''
  })
  
  const definitionEditor = ref(null)
  const isTermsModalFromSimpleEditor = ref(false)
  const isSyncing = ref(false)

  // Generate term line for preview
  const generatedTermLine = computed(() => {
    if (!simpleEditor.value.mainTerm.trim()) {
      return ''
    }

    const mainTerm = simpleEditor.value.mainTerm.trim()
    const validAliases = simpleEditor.value.aliases
      .filter(alias => alias && alias.trim())
      .map(alias => alias.trim())

    if (simpleEditor.value.termType === 'local') {
      if (validAliases.length === 0) {
        return `[[def: ${mainTerm}]]`
      } else {
        return `[[def: ${mainTerm}, ${validAliases.join(', ')}]]`
      }
    } else {
      const externalRepo = simpleEditor.value.externalRepo.trim()
      if (!externalRepo) return ''
      
      if (validAliases.length === 0) {
        return `[[tref: ${externalRepo}, ${mainTerm}]]`
      } else {
        return `[[tref: ${externalRepo}, ${mainTerm}, ${validAliases.join(', ')}]]`
      }
    }
  })

  // Sync simple editor to technical content
  const syncSimpleToTechnical = async (setContent) => {
    if (isSyncing.value) return
    
    isSyncing.value = true
    
    try {
      const termLine = generatedTermLine.value
      
      if (!termLine.trim()) {
        setContent('')
        return
      }
      
      let definitionContent = ''
      if (simpleEditor.value.definition.trim()) {
        const defLines = simpleEditor.value.definition.split('\n')
        definitionContent = defLines.map(line => {
          if (line.trim() === '') return ''
          return `~ ${line}`
        }).join('\n')
      }

      const parts = [termLine]
      if (definitionContent.trim()) {
        parts.push('')
        parts.push(definitionContent)
      }
      
      setContent(parts.join('\n'))
      
    } finally {
      isSyncing.value = false
    }
  }

  // Sync technical content to simple editor
  const syncTechnicalToSimple = (content) => {
    if (!content.trim()) {
      simpleEditor.value = {
        termType: 'local',
        externalRepo: '',
        mainTerm: '',
        aliases: [null],
        definition: ''
      }
      return
    }

    const lines = content.split('\n')
    const firstLine = lines[0]?.trim() || ''

    simpleEditor.value = {
      termType: 'local',
      externalRepo: '',
      mainTerm: '',
      aliases: [null],
      definition: ''
    }

    // Parse term line
    if (firstLine.startsWith('[[def:')) {
      const match = firstLine.match(/^\[\[def:\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
      if (match) {
        simpleEditor.value.mainTerm = match[1].trim()
        
        if (match[2]) {
          const aliases = match[2].split(',').map(a => a.trim()).filter(a => a.length > 0)
          simpleEditor.value.aliases = aliases.length > 0 ? [...aliases, null] : [null]
        }
      }
    } else if (firstLine.startsWith('[[tref:')) {
      const match = firstLine.match(/^\[\[tref:\s*([^,\]]+),\s*([^,\]]+)(?:,\s*([^\]]+))?\]\]/)
      if (match) {
        simpleEditor.value.termType = 'external'
        simpleEditor.value.externalRepo = match[1].trim()
        simpleEditor.value.mainTerm = match[2].trim()
        
        if (match[3]) {
          const aliases = match[3].split(',').map(a => a.trim()).filter(a => a.length > 0)
          simpleEditor.value.aliases = aliases.length > 0 ? [...aliases, null] : [null]
        }
      }
    }

    // Parse definition content
    const definitionLines = []
    let foundContent = false
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.trim() === '') {
        if (foundContent) {
          definitionLines.push('')
        }
      } else if (line.startsWith('~ ')) {
        definitionLines.push(line.substring(2))
        foundContent = true
      } else if (line.startsWith('~')) {
        definitionLines.push(line.substring(1).trim())
        foundContent = true
      } else if (line.trim()) {
        definitionLines.push(line)
        foundContent = true
      }
    }
    
    simpleEditor.value.definition = definitionLines.join('\n').trim()
  }

  // Add alias field
  const addAlias = () => {
    simpleEditor.value.aliases.push(null)
  }

  // Remove alias field
  const removeAlias = (index) => {
    if (simpleEditor.value.aliases.length > 1) {
      simpleEditor.value.aliases.splice(index, 1)
    }
  }

  // Handle alias input changes
  const onAliasInputChange = (index, value) => {
    simpleEditor.value.aliases[index] = value.trim() === '' ? null : value
    
    if (index === simpleEditor.value.aliases.length - 1 && value.trim()) {
      simpleEditor.value.aliases.push(null)
    }
  }

  // Insert text into definition editor
  const insertDefinitionText = async (before, after = '') => {
    const textarea = definitionEditor.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = simpleEditor.value.definition.substring(start, end)

    const replacement = before + selectedText + after
    simpleEditor.value.definition = simpleEditor.value.definition.substring(0, start) + 
      replacement + simpleEditor.value.definition.substring(end)

    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    })
  }

  return {
    // State
    simpleEditor,
    definitionEditor,
    isTermsModalFromSimpleEditor,
    isSyncing,
    
    // Computed
    generatedTermLine,
    
    // Methods
    syncSimpleToTechnical,
    syncTechnicalToSimple,
    addAlias,
    removeAlias,
    onAliasInputChange,
    insertDefinitionText
  }
}
