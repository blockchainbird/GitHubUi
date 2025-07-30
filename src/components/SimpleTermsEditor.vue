<template>
  <div class="simple-editor">
    <div class="card">
      <div class="card-header">
        <h5>
          <i class="bi bi-ui-checks"></i>
          Simple Terms Editor
        </h5>
      </div>
      <div class="card-body">
        <!-- Term Type Selection -->
        <div class="mb-3">
          <label class="form-label">Term Type</label>
          <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" id="termType-local" 
                   v-model="termType" value="local" @change="onFormChange">
            <label class="btn btn-outline-primary" for="termType-local">
              <i class="bi bi-house"></i> Local Term
            </label>

            <input type="radio" class="btn-check" id="termType-external" 
                   v-model="termType" value="external" @change="onFormChange">
            <label class="btn btn-outline-success" for="termType-external">
              <i class="bi bi-link-45deg"></i> External Term
            </label>
          </div>
          <div class="form-text">
            Local terms are defined in this repository. External terms reference definitions from other specifications.
          </div>
        </div>

        <!-- External Repository (shown only for external terms) -->
        <div v-if="termType === 'external'" class="mb-3">
          <label class="form-label">External Repository</label>
          <div class="input-group">
            <input type="text" class="form-control" 
                   v-model="externalRepo"
                   @input="onFormChange"
                   placeholder="e.g., toip1, did-core">
            <button class="btn btn-outline-info" type="button" @click="$emit('show-external-terms')">
              <i class="bi bi-search"></i> Browse
            </button>
          </div>
          <div class="form-text">
            The identifier of the external specification containing the term.
          </div>
        </div>

        <!-- Main Term -->
        <div class="mb-3">
          <label for="mainTerm" class="form-label">Term Name</label>
          <input type="text" class="form-control" id="mainTerm"
                 v-model="mainTerm"
                 @input="onFormChange"
                 placeholder="Enter the main term">
          <div class="form-text">
            The primary name for this term (e.g., "verifiable-credential").
          </div>
        </div>

        <!-- Aliases -->
        <div class="mb-3">
          <label class="form-label">Aliases (Optional)</label>
          <div v-for="(alias, index) in aliases" :key="index" class="input-group mb-2">
            <input type="text" class="form-control" 
                   :value="alias || ''"
                   @input="e => onAliasChange(index, e.target.value)"
                   @focus="onAliasInputFocus(index)"
                   @blur="onAliasInputBlur(index)"
                   placeholder="Enter alias">
            <button class="btn btn-outline-danger" type="button" 
                    @click="removeAlias(index)"
                    :disabled="aliases.length <= 1">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <button class="btn btn-outline-secondary btn-sm" @click="addAlias">
            <i class="bi bi-plus"></i> Add Alias
          </button>
          <div class="form-text">
            Alternative names for the term (e.g., "VC", "credential").
          </div>
        </div>

        <!-- Generated Term Line Preview -->
        <div v-if="generatedTermLine" class="generated-term-line">
          <label class="form-label">Generated Term Line</label>
          <code>{{ generatedTermLine }}</code>
        </div>

        <!-- Definition -->
        <div class="mb-3">
          <label for="definition" class="form-label">Definition</label>
          
          <!-- Definition Toolbar -->
          <div class="definition-editor-toolbar">
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-secondary" 
                      @click="$emit('insert-definition-text', '**', '**')"
                      title="Bold">
                <i class="bi bi-type-bold"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" 
                      @click="$emit('insert-definition-text', '_', '_')"
                      title="Italic">
                <i class="bi bi-type-italic"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" 
                      @click="$emit('insert-definition-text', '`', '`')"
                      title="Code">
                <i class="bi bi-code"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" 
                      @click="$emit('insert-definition-text', '[', '](url)')"
                      title="Link">
                <i class="bi bi-link"></i>
              </button>
            </div>
          </div>

          <textarea class="form-control" id="definition" rows="6"
                    ref="definitionEditor"
                    v-model="definition"
                    @input="onDefinitionInput"
                    @keydown.enter="onDefinitionEnter"
                    placeholder="Write the definition content here..."></textarea>
          <div class="form-text">
            The definition content. Each paragraph will be automatically prefixed with "~" in the technical format.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'SimpleTermsEditor',
  props: {
    termType: {
      type: String,
      default: 'local'
    },
    externalRepo: {
      type: String,
      default: ''
    },
    mainTerm: {
      type: String,
      default: ''
    },
    aliases: {
      type: Array,
      default: () => [null]
    },
    definition: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update:termType',
    'update:externalRepo', 
    'update:mainTerm',
    'update:aliases',
    'update:definition',
    'form-change',
    'definition-input',
    'definition-enter',
    'show-external-terms',
    'insert-definition-text'
  ],
  setup(props, { emit }) {
    const generatedTermLine = computed(() => {
      if (!props.mainTerm.trim()) {
        return ''
      }

      const mainTerm = props.mainTerm.trim()
      const validAliases = props.aliases
        .filter(alias => alias && alias.trim())
        .map(alias => alias.trim())

      if (props.termType === 'local') {
        if (validAliases.length === 0) {
          return `[[def: ${mainTerm}]]`
        } else {
          return `[[def: ${mainTerm}, ${validAliases.join(', ')}]]`
        }
      } else {
        const externalRepo = props.externalRepo.trim()
        if (!externalRepo) return ''
        
        if (validAliases.length === 0) {
          return `[[tref: ${externalRepo}, ${mainTerm}]]`
        } else {
          return `[[tref: ${externalRepo}, ${mainTerm}, ${validAliases.join(', ')}]]`
        }
      }
    })

    const termType = computed({
      get: () => props.termType,
      set: (value) => emit('update:termType', value)
    })

    const externalRepo = computed({
      get: () => props.externalRepo,
      set: (value) => emit('update:externalRepo', value)
    })

    const mainTerm = computed({
      get: () => props.mainTerm,
      set: (value) => emit('update:mainTerm', value)
    })

    const aliases = computed({
      get: () => props.aliases,
      set: (value) => emit('update:aliases', value)
    })

    const definition = computed({
      get: () => props.definition,
      set: (value) => emit('update:definition', value)
    })

    const onFormChange = () => {
      emit('form-change')
    }

    const onDefinitionInput = () => {
      emit('definition-input')
    }

    const onDefinitionEnter = (event) => {
      emit('definition-enter', event)
    }

    const addAlias = () => {
      const newAliases = [...props.aliases, null]
      emit('update:aliases', newAliases)
      emit('form-change')
    }

    const removeAlias = (index) => {
      if (props.aliases.length > 1) {
        const newAliases = [...props.aliases]
        newAliases.splice(index, 1)
        emit('update:aliases', newAliases)
        emit('form-change')
      }
    }

    const onAliasChange = (index, value) => {
      const newAliases = [...props.aliases]
      newAliases[index] = value.trim() === '' ? null : value
      
      if (index === newAliases.length - 1 && value.trim()) {
        newAliases.push(null)
      }
      
      emit('update:aliases', newAliases)
      emit('form-change')
    }

    const onAliasInputFocus = () => {
      // No specific action needed
    }

    const onAliasInputBlur = (index) => {
      if (!props.aliases[index] || props.aliases[index].trim() === '') {
        const newAliases = [...props.aliases]
        newAliases[index] = null
        emit('update:aliases', newAliases)
      }
    }

    return {
      generatedTermLine,
      termType,
      externalRepo,
      mainTerm,
      aliases,
      definition,
      onFormChange,
      onDefinitionInput,
      onDefinitionEnter,
      addAlias,
      removeAlias,
      onAliasChange,
      onAliasInputFocus,
      onAliasInputBlur
    }
  }
}
</script>

<style scoped>
.simple-editor .card {
  border-width: 2px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.simple-editor .card-header {
  font-weight: 600;
}

.simple-editor .card-header h5 {
  margin: 0;
  display: flex;
  align-items: center;
}

.simple-editor .card-header i {
  margin-right: 0.5rem;
}

.generated-term-line {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.generated-term-line code {
  background-color: white;
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: block;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #495057;
}

.definition-editor-toolbar {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
}

.form-label {
  color: #495057;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.btn-group .btn-check:checked + .btn {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}
</style>
