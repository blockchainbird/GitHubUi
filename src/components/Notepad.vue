<template>
    <Teleport to="body">
        <!-- Floating notepad button -->
        <button v-if="!isOpen" @click="openNotepad" class="notepad-trigger" title="Open Notepad">
            <i class="bi bi-sticky"></i>
        </button>

        <!-- Notepad window -->
        <div v-if="isOpen" ref="notepadContainer" class="notepad-container"
            :style="{ top: position.y + 'px', left: position.x + 'px', width: size.width + 'px', height: size.height + 'px' }">
            <!-- Notepad header with drag handle -->
            <div ref="notepadHeader" class="notepad-header" @mousedown="startDrag">
                <div class="notepad-title">
                    <i class="bi bi-sticky-fill"></i>
                    <span>Notepad</span>
                </div>
                <div class="notepad-actions">
                    <button @click="copyContent" class="btn-icon" title="Copy all content">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button @click="clearContent" class="btn-icon" title="Clear all content">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button @click="closeNotepad" class="btn-icon" title="Close notepad">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>

            <!-- Notepad content -->
            <div class="notepad-body">
                <textarea ref="notepadTextarea" v-model="content" @input="handleContentChange" class="notepad-textarea"
                    placeholder="Your notes will be auto-saved here..."></textarea>
                <div class="notepad-footer">
                    <small class="text-muted">
                        <i class="bi bi-cloud-check"></i>
                        Auto-saved • {{ formatSize(currentSize) }} used
                    </small>
                </div>
            </div>

            <!-- Resize handle -->
            <div ref="resizeHandle" class="notepad-resize-handle" @mousedown="startResize"></div>
        </div>
    </Teleport>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useNotepad } from '../composables/useNotepad.js'

export default {
    name: 'Notepad',
    setup() {
        const notepadContainer = ref(null)
        const notepadHeader = ref(null)
        const notepadTextarea = ref(null)
        const resizeHandle = ref(null)

        const {
            isOpen,
            content,
            currentSize,
            openNotepad,
            closeNotepad,
            addContent,
            copyContent,
            clearContent,
            formatSize
        } = useNotepad()

        // Position and size state
        const position = ref({ x: 100, y: 100 })
        const size = ref({ width: 400, height: 300 })

        // Drag state
        const isDragging = ref(false)
        const dragOffset = ref({ x: 0, y: 0 })

        // Resize state
        const isResizing = ref(false)
        const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

        // Load saved position and size
        const loadPositionAndSize = () => {
            const savedPosition = localStorage.getItem('notepad_position')
            const savedSize = localStorage.getItem('notepad_size')

            if (savedPosition) {
                try {
                    position.value = JSON.parse(savedPosition)
                } catch (e) {
                    console.warn('Failed to parse saved notepad position')
                }
            }

            if (savedSize) {
                try {
                    size.value = JSON.parse(savedSize)
                } catch (e) {
                    console.warn('Failed to parse saved notepad size')
                }
            }
        }

        // Save position and size
        const savePositionAndSize = () => {
            localStorage.setItem('notepad_position', JSON.stringify(position.value))
            localStorage.setItem('notepad_size', JSON.stringify(size.value))
        }

        // Drag functionality
        const startDrag = (event) => {
            if (event.target.closest('.notepad-actions')) return

            isDragging.value = true
            const rect = notepadContainer.value.getBoundingClientRect()
            dragOffset.value = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }

            document.addEventListener('mousemove', handleDrag)
            document.addEventListener('mouseup', stopDrag)
            event.preventDefault()
        }

        const handleDrag = (event) => {
            if (!isDragging.value) return

            const newX = event.clientX - dragOffset.value.x
            const newY = event.clientY - dragOffset.value.y

            // Keep within viewport bounds
            const maxX = window.innerWidth - size.value.width
            const maxY = window.innerHeight - size.value.height

            position.value = {
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            }
        }

        const stopDrag = () => {
            isDragging.value = false
            document.removeEventListener('mousemove', handleDrag)
            document.removeEventListener('mouseup', stopDrag)
            savePositionAndSize()
        }

        // Resize functionality
        const startResize = (event) => {
            isResizing.value = true
            resizeStart.value = {
                x: event.clientX,
                y: event.clientY,
                width: size.value.width,
                height: size.value.height
            }

            document.addEventListener('mousemove', handleResize)
            document.addEventListener('mouseup', stopResize)
            event.preventDefault()
        }

        const handleResize = (event) => {
            if (!isResizing.value) return

            const deltaX = event.clientX - resizeStart.value.x
            const deltaY = event.clientY - resizeStart.value.y

            const newWidth = Math.max(300, resizeStart.value.width + deltaX)
            const newHeight = Math.max(200, resizeStart.value.height + deltaY)

            // Keep within viewport bounds
            const maxWidth = window.innerWidth - position.value.x
            const maxHeight = window.innerHeight - position.value.y

            size.value = {
                width: Math.min(newWidth, maxWidth),
                height: Math.min(newHeight, maxHeight)
            }
        }

        const stopResize = () => {
            isResizing.value = false
            document.removeEventListener('mousemove', handleResize)
            document.removeEventListener('mouseup', stopResize)
            savePositionAndSize()
        }

        // Handle content change with debouncing
        let contentChangeTimeout
        const handleContentChange = () => {
            clearTimeout(contentChangeTimeout)
            contentChangeTimeout = setTimeout(() => {
                // Content is automatically saved in the useNotepad composable
            }, 500)
        }

        // Focus textarea when notepad opens
        watch(isOpen, async (newValue) => {
            if (newValue) {
                await nextTick()
                if (notepadTextarea.value) {
                    notepadTextarea.value.focus()
                }
            }
        })

        // Handle window resize
        const handleWindowResize = () => {
            // Ensure notepad stays within viewport
            const maxX = window.innerWidth - size.value.width
            const maxY = window.innerHeight - size.value.height

            if (position.value.x > maxX) {
                position.value.x = Math.max(0, maxX)
            }
            if (position.value.y > maxY) {
                position.value.y = Math.max(0, maxY)
            }
        }

        onMounted(() => {
            loadPositionAndSize()
            window.addEventListener('resize', handleWindowResize)
        })

        onUnmounted(() => {
            clearTimeout(contentChangeTimeout)
            window.removeEventListener('resize', handleWindowResize)
            document.removeEventListener('mousemove', handleDrag)
            document.removeEventListener('mouseup', stopDrag)
            document.removeEventListener('mousemove', handleResize)
            document.removeEventListener('mouseup', stopResize)
        })

        // Expose addContent method for external use
        const { addContent: addContentInternal } = useNotepad()

        return {
            // Refs
            notepadContainer,
            notepadHeader,
            notepadTextarea,
            resizeHandle,

            // State
            isOpen,
            content,
            currentSize,
            position,
            size,

            // Methods
            openNotepad,
            closeNotepad,
            addContent: addContentInternal,
            copyContent,
            clearContent,
            formatSize,
            handleContentChange,
            startDrag,
            startResize
        }
    }
}
</script>

<style scoped>
.notepad-trigger {
    position: fixed;
    bottom: 10px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #4dabf7;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
    transition: all 0.2s ease;
}

.notepad-trigger:hover {
    background: #339af0;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(77, 171, 247, 0.4);
}

.notepad-container {
    position: fixed;
    background: #e7f5ff;
    border: 2px solid #4dabf7;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
    overflow: hidden;
    user-select: none;
}

.notepad-header {
    background: linear-gradient(135deg, #4dabf7, #339af0);
    color: white;
    padding: 8px 12px;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #74c0fc;
}

.notepad-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
}

.notepad-actions {
    display: flex;
    gap: 4px;
}

.btn-icon {
    background: transparent;
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.btn-icon:hover {
    background: rgba(255, 255, 255, 0.2);
}

.notepad-body {
    display: flex;
    flex-direction: column;
    height: calc(100% - 40px);
}

.notepad-textarea {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    outline: none;
    color: #495057;
}

.notepad-textarea::placeholder {
    color: #74c0fc;
    font-style: italic;
}

.notepad-footer {
    padding: 8px 12px;
    border-top: 1px solid #a5d8ff;
    background: rgba(116, 192, 252, 0.1);
}

.notepad-resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
    background: linear-gradient(-45deg, transparent 30%, #4dabf7 30%, #4dabf7 40%, transparent 40%, transparent 60%, #4dabf7 60%, #4dabf7 70%, transparent 70%);
}

.notepad-resize-handle:hover {
    background: linear-gradient(-45deg, transparent 30%, #339af0 30%, #339af0 40%, transparent 40%, transparent 60%, #339af0 60%, #339af0 70%, transparent 70%);
}

/* Animation for opening */
.notepad-container {
    animation: notepadSlideIn 0.3s ease-out;
}

@keyframes notepadSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Prevent text selection during drag/resize */
.notepad-container.dragging,
.notepad-container.resizing {
    user-select: none;
}
</style>
