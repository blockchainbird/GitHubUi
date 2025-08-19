<template>
  <div class="simple-editor p-0 h-100 d-flex flex-column">
    <div class="card border-0 h-100 d-flex flex-column">
      <div class="card-body flex-grow-1 d-flex flex-column">
        <!-- Main Term -->
        <div class="mb-3 row align-items-center">
          <label for="mainTerm" class="col-sm-3 col-form-label text-dark"><i
              title="The primary name for this term (e.g., “verifiable-credential”)."
              class="bi bi-question-circle fs-5 text-primary"></i> Term Name</label>
          <div class="col-sm-9">
            <input type="text" class="form-control" id="mainTerm" v-model="mainTerm" @input="onFormChange"
              placeholder="Enter the main term">
          </div>
        </div>

        <!-- Aliases -->
        <div class="mb-3 row align-items-start">
          <label class="col-sm-3 col-form-label text-dark"><i
              title="Alternative names for the term (e.g., “VC”, “credential”)."
              class="bi bi-question-circle fs-5 text-primary"></i> Aliases (Optional)</label>
          <div class="col-sm-9">
            <div v-for="(alias, index) in aliases" :key="index" class="input-group mb-2">
              <input type="text" class="form-control" :value="alias || ''"
                @input="e => onAliasChange(index, e.target.value)" @focus="onAliasInputFocus(index)"
                @blur="onAliasInputBlur(index)" placeholder="Enter alias">
              <button class="btn btn-outline-danger" type="button" @click="removeAlias(index)"
                :disabled="aliases.length <= 1">
                <i class="bi bi-trash"></i>
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="addAlias">
                <i class="bi bi-plus"></i> Add Alias
              </button>
            </div>
          </div>
        </div>

        <!-- Term Type Selection (External Repository input shown inline for external terms) -->
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label text-dark"><i
              title="Local terms are defined in this repository. External terms reference definitions from other specifications."
              class="bi bi-question-circle fs-5 text-primary"></i> Term Type</label>
          <div class="col-sm-9 d-flex align-items-center">
            <div class="btn-group me-3" role="group">
              <input type="radio" class="btn-check" id="termType-local" v-model="termType" value="local"
                @change="onFormChange">
              <label class="btn btn-outline-primary" for="termType-local">
                <i class="bi bi-house"></i> Local
              </label>

              <input type="radio" class="btn-check" id="termType-external" v-model="termType" value="external"
                @change="onFormChange">
              <label class="btn btn-outline-success" for="termType-external">
                <i class="bi bi-link-45deg"></i> External
              </label>
            </div>

            <div v-if="termType === 'external'" class="flex-grow-1">
              <div class="input-group">
                <input type="text" class="form-control" v-model="externalRepo" @input="onFormChange"
                  placeholder="e.g., toip1, did-core">
                <button class="btn btn-outline-info" type="button" @click="$emit('show-external-terms')">
                  <i class="bi bi-search"></i> Browse
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Generated Term Line Preview -->
        <div v-if="generatedTermLine" class="d-none generated-term-line mb-3 row">
          <label class="col-sm-3 col-form-label text-dark"><i title="The term, using the brackets templates."
              class="bi bi-question-circle fs-5 text-primary"></i> Generated Term</label>
          <div class="col-sm-9">
            <code
              class="bg-white border p-2 rounded d-inline-block font-monospace text-body">{{ generatedTermLine }}</code>
          </div>
        </div>

        <!-- Definition -->
        <div class="mb-3 row align-items-start flex-grow-1">
          <label for="definition" class="col-sm-3 col-form-label"><i
              title="The definition content. Each paragraph will be automatically prefixed with “~” in the technical format."
              class="bi bi-question-circle fs-5 text-primary"></i> Definition</label>

          <div class="col-sm-9 d-flex flex-column h-100">
            <div v-if="termType === 'external'" class="external-term-reference">
              <p class="text-muted mb-2">
                &lt;external term definition, see “Preview” tab&gt;
              </p>
            </div>
            <!-- Definition Toolbar -->
            <div class="definition-editor-toolbar bg-light border rounded-2 p-2 mb-3 flex-shrink-0">
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-secondary"
                  @click="$emit('insert-definition-text', '**', '**')" title="Bold">
                  <i class="bi bi-type-bold"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary"
                  @click="$emit('insert-definition-text', '_', '_')" title="Italic">
                  <i class="bi bi-type-italic"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary"
                  @click="$emit('insert-definition-text', '`', '`')" title="Code">
                  <i class="bi bi-code"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary"
                  @click="$emit('insert-definition-text', '[', '](url)')" title="Link">
                  <i class="bi bi-link"></i>
                </button>
              </div>
            </div>

            <textarea class="form-control flex-grow-1" id="definition" ref="definitionEditor" v-model="definition"
              @input="onDefinitionInput" @keydown.enter="onDefinitionEnter"
              placeholder="Write the definition content here..."
              style="min-height: 200px; resize: vertical;"></textarea>
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
        // Keep the preview visible even when the external repo hasn't been filled in yet.
        // Show a lightweight placeholder so the user sees the external tref format immediately.
        const repoDisplay = externalRepo || '<repo>'

        if (validAliases.length === 0) {
          return `[[tref: ${repoDisplay}, ${mainTerm}]]`
        } else {
          return `[[tref: ${repoDisplay}, ${mainTerm}, ${validAliases.join(', ')}]]`
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
/* Reduce emphasis from heavy bold headings/labels used only in this editor */
.simple-editor .card-header {
  font-weight: 500;
  /* lighter than fw-semibold */
}

.simple-editor .col-form-label,
.simple-editor .form-label {
  font-weight: 500;
  /* moderate weight for readability without shouting */
  margin-bottom: 0.25rem;
}

/* Prevent some elements from stretching full width and make code preview inline */
.simple-editor .generated-term-line code {
  max-width: 100%;
  display: inline-block;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Reduce prominence of toolbar icons */
.definition-editor-toolbar .btn {
  opacity: 0.95;
}
/* Ensure textarea uses available height optimally */
.simple-editor .flex-grow-1 textarea {
  min-height: 300px;
}
</style>