<template>
    <!-- 
        OffcanvasExternalRefsFlowchart component
        
        Displays a flowchart visualization of external specifications and their
        dependencies using Mermaid.js. The flowchart shows the hierarchy of 
        external references up to a configurable depth.
        
        The offcanvas slides in from the right side of the screen.
    -->
    <div class="offcanvas offcanvas-end" :class="{ show: isVisible, hide: !isVisible && hasBeenOpened }" tabindex="-1" id="externalRefsFlowchartOffcanvas"
        data-bs-backdrop="true" aria-labelledby="externalRefsFlowchartLabel"
        :style="{ visibility: (isVisible || isClosing) ? 'visible' : 'hidden', width: offcanvasWidth }">
        
        <!-- Resize handle on the left edge -->
        <div 
            class="resize-handle" 
            @mousedown="startResize"
            title="Drag to resize"
        ></div>
        
        <div class="offcanvas-header border-bottom">
            <h5 class="offcanvas-title" id="externalRefsFlowchartLabel">
                <i class="bi bi-diagram-3 me-2"></i>
                External References Flowchart
            </h5>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        
        <div class="offcanvas-body p-0 d-flex flex-column">
            <!-- Controls Section -->
            <div class="controls-section p-3 border-bottom bg-light">
                <div class="d-flex align-items-end gap-3">
                    <div class="flex-shrink-0">
                        <label for="maxDepthSelect" class="form-label small text-muted mb-1">Max Depth</label>
                        <select id="maxDepthSelect" class="form-select form-select-sm" v-model.number="maxDepth" @change="handleGenerate">
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                            <option :value="4">4</option>
                            <option :value="5">5</option>
                        </select>
                    </div>
                    <div class="flex-shrink-0">
                        <button 
                            class="btn btn-primary btn-sm" 
                            @click="handleGenerate"
                            :disabled="loading || !currentRepoUrl"
                        >
                            <i class="bi" :class="loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"></i>
                            {{ loading ? 'Refreshing...' : 'Refresh' }}
                        </button>
                    </div>
                    <div class="flex-grow-1 text-muted small d-flex align-items-end pb-1" v-if="currentRepoUrl">
                        <i class="bi bi-diagram-3 me-1"></i>
                        Showing: Current repository
                    </div>
                </div>
            </div>
            
            <!-- Error Display -->
            <div v-if="error" class="alert alert-danger m-3 mb-0" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{ error }}
            </div>
            
            <!-- Loading State -->
            <output v-if="loading" class="text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center d-block">
                <div>
                    <div class="spinner-border text-primary mb-3" aria-busy="true">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted mb-0">Fetching external specifications...</p>
                    <p class="text-muted small">This may take a moment for deep hierarchies</p>
                </div>
            </output>
            
            <!-- Flowchart Display -->
            <div v-else-if="mermaidCode" class="flowchart-container flex-grow-1 p-3 overflow-auto">
                <!-- Zoom Controls -->
                <div class="zoom-controls mb-2 d-flex gap-2 align-items-center">
                    <button 
                        class="btn btn-sm btn-outline-secondary" 
                        @click="zoomIn"
                        title="Zoom In"
                    >
                        <i class="bi bi-zoom-in"></i>
                    </button>
                    <button 
                        class="btn btn-sm btn-outline-secondary" 
                        @click="zoomOut"
                        title="Zoom Out"
                    >
                        <i class="bi bi-zoom-out"></i>
                    </button>
                    <button 
                        class="btn btn-sm btn-outline-secondary" 
                        @click="resetZoom"
                        title="Reset Zoom"
                    >
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    <span class="text-muted small ms-2">{{ Math.round(zoomLevel * 100) }}%</span>
                </div>
                
                <div class="flowchart-wrapper bg-white rounded border p-3">
                    <div 
                        ref="mermaidContainer" 
                        class="mermaid-diagram" 
                        :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }"
                    ></div>
                </div>
                
                <!-- Mermaid Code Toggle -->
                <div class="mt-3">
                    <button 
                        class="btn btn-outline-secondary btn-sm" 
                        @click="showCode = !showCode"
                    >
                        <i class="bi" :class="showCode ? 'bi-eye-slash' : 'bi-code'"></i>
                        {{ showCode ? 'Hide Code' : 'Show Mermaid Code' }}
                    </button>
                    
                    <button 
                        class="btn btn-outline-secondary btn-sm ms-2" 
                        @click="copyCode"
                        v-if="showCode"
                    >
                        <i class="bi bi-clipboard"></i>
                        Copy Code
                    </button>
                </div>
                
                <div v-if="showCode" class="mt-2">
                    <pre class="bg-dark text-light p-3 rounded small overflow-auto" style="max-height: 200px;">{{ mermaidCode }}</pre>
                </div>
            </div>
            
            <!-- Empty State -->
            <div v-else class="empty-state text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center">
                <div>
                    <i class="bi bi-diagram-3 text-muted" style="font-size: 4rem;"></i>
                    <h6 class="mt-3 text-muted">No Repository Loaded</h6>
                    <p class="text-muted small mb-0">
                        Load a repository to visualize<br>
                        its external reference dependencies.
                    </p>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="info-section p-3 border-top bg-light mt-auto">
                <div class="small text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    <strong>How it works:</strong> 
                    This flowchart fetches the <code>external_specs</code> from each specification's 
                    <code>index.html</code> and recursively builds a dependency graph up to the 
                    configured depth (currently: {{ maxDepth }}).
                </div>
            </div>
        </div>
    </div>
    
    <!-- Backdrop overlay -->
    <div v-if="isVisible || isClosing" class="offcanvas-backdrop fade" :class="{ show: isVisible }" @click="close"></div>
</template>

<script>
/**
 * OffcanvasExternalRefsFlowchart Component
 * 
 * This component provides a right-side offcanvas panel that displays a Mermaid.js
 * flowchart visualization of external specification dependencies.
 * 
 * Features:
 * - URL input for any Spec-Up-T specification
 * - Configurable recursion depth
 * - Mermaid.js rendering of the dependency graph
 * - Code view toggle for the generated Mermaid syntax
 * - Auto-open when accessed via specific URL parameter
 * 
 * @component
 */

import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useExternalRefsFlowchart } from '../composables/useExternalRefsFlowchart.js'

export default {
    name: 'OffcanvasExternalRefsFlowchart',
    
    props: {
        /**
         * Controls visibility of the offcanvas panel
         */
        visible: {
            type: Boolean,
            default: false
        },
        /**
         * Initial URL to load (e.g., from URL parameter)
         */
        initialUrl: {
            type: String,
            default: ''
        },
        /**
         * Whether to auto-generate on open
         */
        autoGenerate: {
            type: Boolean,
            default: false
        }
    },
    
    emits: ['close'],
    
    setup(props, { emit }) {
        const route = useRoute()
        const {
            loading,
            error,
            mermaidCode,
            generateFlowchart
        } = useExternalRefsFlowchart()
        
        // Local state
        const isVisible = ref(false)
        const hasBeenOpened = ref(false) // Track if offcanvas was ever opened
        const isClosing = ref(false) // Track if currently closing for animation
        const maxDepth = ref(3)
        const showCode = ref(false)
        const mermaidContainer = ref(null)
        const offcanvasWidth = ref(`${window.innerWidth - 100}px`)
        const zoomLevel = ref(1) // Zoom level for the flowchart (1 = 100%)
        const isResizing = ref(false)
        const startX = ref(0)
        const startWidth = ref(0)
        
        /**
         * Computes the current repository's GitHub Pages URL if available.
         * This allows quick loading of the current repo's flowchart.
         */
        const currentRepoUrl = computed(() => {
            const { owner, repo } = route.params
            if (owner && repo) {
                return `https://${owner}.github.io/${repo}/`
            }
            return null
        })
        
        /**
         * Handles the generate/refresh button click.
         * Uses the current repository URL to generate the flowchart.
         */
        const handleGenerate = async () => {
            if (!currentRepoUrl.value) return
            
            await generateFlowchart(currentRepoUrl.value)
            
            // Render Mermaid diagram after generation
            await nextTick()
            renderMermaid()
        }
        
        /**
         * Renders the Mermaid diagram in the container.
         * Dynamically loads Mermaid.js if not already available.
         */
        const renderMermaid = async () => {
            if (!mermaidCode.value || !mermaidContainer.value) return
            
            try {
                // Check if Mermaid is loaded, if not, load it dynamically
                if (!globalThis.mermaid) {
                    await loadMermaidScript()
                }
                
                // Clear previous content
                mermaidContainer.value.innerHTML = ''
                
                // Generate unique ID for this diagram
                const diagramId = 'mermaid-' + Date.now()
                
                // Render the diagram
                const { svg } = await globalThis.mermaid.render(diagramId, mermaidCode.value)
                mermaidContainer.value.innerHTML = svg
                
            } catch (err) {
                console.error('Failed to render Mermaid diagram:', err)
                mermaidContainer.value.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Failed to render diagram: ${err.message}
                    </div>
                `
            }
        }
        
        /**
         * Dynamically loads the Mermaid.js library from CDN.
         * 
         * @returns {Promise<void>}
         */
        const loadMermaidScript = () => {
            return new Promise((resolve, reject) => {
                // Check if already loading or loaded
                if (globalThis.mermaid) {
                    resolve()
                    return
                }
                
                // Check if script is already being loaded
                if (document.querySelector('script[src*="mermaid"]')) {
                    // Wait for it to load
                    const checkInterval = setInterval(() => {
                        if (globalThis.mermaid) {
                            clearInterval(checkInterval)
                            resolve()
                        }
                    }, 100)
                    return
                }
                
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
                script.async = true
                
                script.onload = () => {
                    // Initialize Mermaid with custom config
                    globalThis.mermaid.initialize({
                        startOnLoad: false,
                        theme: 'default',
                        flowchart: {
                            useMaxWidth: true,
                            htmlLabels: true,
                            curve: 'basis'
                        },
                        securityLevel: 'loose'
                    })
                    resolve()
                }
                
                script.onerror = () => {
                    reject(new Error('Failed to load Mermaid.js'))
                }
                
                document.head.appendChild(script)
            })
        }
        
        /**
         * Copies the Mermaid code to clipboard.
         */
        const copyCode = async () => {
            try {
                await navigator.clipboard.writeText(mermaidCode.value)
                // Could add a toast notification here
            } catch (err) {
                console.error('Failed to copy:', err)
            }
        }
        
        /**
         * Zooms in the flowchart.
         */
        const zoomIn = () => {
            zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3) // Max 300%
        }
        
        /**
         * Zooms out the flowchart.
         */
        const zoomOut = () => {
            zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.3) // Min 30%
        }
        
        /**
         * Resets the zoom level to 100%.
         */
        const resetZoom = () => {
            zoomLevel.value = 1
        }
        
        /**
         * Starts the resize operation when user clicks on the resize handle.
         * 
         * @param {MouseEvent} event - The mousedown event
         */
        const startResize = (event) => {
            isResizing.value = true
            startX.value = event.clientX
            // Parse current width (remove 'px')
            startWidth.value = Number.parseInt(offcanvasWidth.value, 10)
            
            // Add event listeners for dragging
            document.addEventListener('mousemove', handleResize)
            document.addEventListener('mouseup', stopResize)
            
            // Prevent text selection during drag
            event.preventDefault()
        }
        
        /**
         * Handles the mouse move during resize.
         * 
         * @param {MouseEvent} event - The mousemove event
         */
        const handleResize = (event) => {
            if (!isResizing.value) return
            
            // Calculate the delta (negative because we're dragging from right to left)
            const deltaX = startX.value - event.clientX
            const newWidth = startWidth.value + deltaX
            
            // Constrain width between 400px and 90vw
            const minWidth = 400
            const maxWidth = window.innerWidth * 0.9
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                offcanvasWidth.value = newWidth + 'px'
            }
        }
        
        /**
         * Stops the resize operation.
         */
        const stopResize = () => {
            isResizing.value = false
            document.removeEventListener('mousemove', handleResize)
            document.removeEventListener('mouseup', stopResize)
        }
        
        /**
         * Closes the offcanvas panel.
         */
        const close = () => {
            isVisible.value = false
            isClosing.value = true
            
            // Wait for animation to complete before cleaning up
            setTimeout(() => {
                isClosing.value = false
                hasBeenOpened.value = false
            }, 350) // Match the CSS transition duration
            
            document.body.classList.remove('offcanvas-open')
            document.removeEventListener('keydown', handleEscKey)
            emit('close')
        }
        
        /**
         * Handles Escape key to close the offcanvas.
         * 
         * @param {KeyboardEvent} event - The keyboard event
         */
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isVisible.value) {
                close()
            }
        }
        
        /**
         * Updates offcanvas width on window resize.
         */
        const updateWidth = () => {
            if (!isResizing.value) {
                offcanvasWidth.value = `${window.innerWidth - 100}px`
            }
        }
        
        // Set up resize listener on mount
        onMounted(() => {
            window.addEventListener('resize', updateWidth)
        })
        
        // Watch for visibility prop changes
        watch(() => props.visible, (newVal) => {
            isVisible.value = newVal
            if (newVal) {
                hasBeenOpened.value = true
                isClosing.value = false
                document.body.classList.add('offcanvas-open')
                document.addEventListener('keydown', handleEscKey)
                
                // Auto-generate flowchart for current repository
                if (currentRepoUrl.value) {
                    nextTick(() => handleGenerate())
                }
            } else {
                document.body.classList.remove('offcanvas-open')
                document.removeEventListener('keydown', handleEscKey)
            }
        }, { immediate: true })
        
        // Re-render when mermaidCode changes
        watch(mermaidCode, () => {
            nextTick(() => renderMermaid())
        })
        
        // Cleanup on unmount
        onUnmounted(() => {
            document.removeEventListener('keydown', handleEscKey)
            document.removeEventListener('mousemove', handleResize)
            document.removeEventListener('mouseup', stopResize)
            window.removeEventListener('resize', updateWidth)
            document.body.classList.remove('offcanvas-open')
        })
        
        return {
            // State
            isVisible,
            hasBeenOpened,
            isClosing,
            maxDepth,
            showCode,
            mermaidContainer,
            offcanvasWidth,
            loading,
            error,
            mermaidCode,
            currentRepoUrl,
            zoomLevel,
            
            // Methods
            handleGenerate,
            copyCode,
            zoomIn,
            zoomOut,
            resetZoom,
            startResize,
            close
        }
    }
}
</script>

<style scoped>
/* Offcanvas styling for right-side panel */
.offcanvas {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 800px;
    max-width: 95vw;
    background-color: #fff;
    z-index: 1050;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.35s ease-in-out;
    transform: translateX(100%);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Resize handle on the left edge */
.resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    z-index: 1000;
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
    transition: background 0.2s;
}

.resize-handle:hover {
    background: linear-gradient(to right, transparent, rgba(0, 123, 255, 0.2));
}

.resize-handle:active {
    background: linear-gradient(to right, transparent, rgba(0, 123, 255, 0.4));
}

/* Open state - slide in from right */
.offcanvas.show {
    transform: translateX(0);
}

/* Closed state - slide out to right */
.offcanvas.hide {
    transform: translateX(100%);
}

/* Backdrop overlay */
.offcanvas-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
    opacity: 0;
    transition: opacity 0.35s ease-in-out;
}

.offcanvas-backdrop.show {
    opacity: 1;
}

/* Make the offcanvas responsive */
@media (min-width: 992px) {
    .offcanvas {
        width: 850px;
    }
}

@media (min-width: 1200px) {
    .offcanvas {
        width: 900px;
    }
}

@media (min-width: 1400px) {
    .offcanvas {
        width: 950px;
    }
}

/* Flowchart container */
.flowchart-container {
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;
}

.flowchart-wrapper {
    flex: 1;
    min-height: 300px;
    overflow: auto;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
}

.mermaid-diagram {
    width: 100%;
    height: 100%;
    min-height: 200px;
    transition: transform 0.2s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mermaid-diagram :deep(svg) {
    width: 100%;
    height: auto;
    min-height: 100%;
}

/* Zoom controls */
.zoom-controls {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(248, 249, 250, 0.95);
    padding: 8px;
    border-radius: 4px;
}

/* Spinner animation */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Code block styling */
pre {
    font-size: 0.75rem;
    line-height: 1.4;
}

/* Global style for body when offcanvas is open */
:global(body.offcanvas-open) {
    overflow: hidden;
}
</style>
