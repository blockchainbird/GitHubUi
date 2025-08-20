<template>
    <div class="offcanvas offcanvas-start" :class="{ show: isVisible }" tabindex="-1" id="fileExplorerOffcanvas"
        data-bs-backdrop="true" aria-labelledby="fileExplorerOffcanvasLabel"
        :style="{ visibility: isVisible ? 'visible' : 'hidden' }">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="fileExplorerOffcanvasLabel">
                <i class="bi bi-folder"></i>
                File Explorer
            </h5>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body p-0">
            <FileExplorer v-if="repositoryInfo && isVisible" :owner="repositoryInfo.owner" :repo="repositoryInfo.repo"
                :branch="repositoryInfo.branch" :is-offcanvas-mode="true" @file-selected="onFileSelected"
                @close-offcanvas="close" />
            <div v-else-if="!repositoryInfo" class="p-3 text-center text-muted">
                <i class="bi bi-folder2-open" style="font-size: 2rem;"></i>
                <p class="mt-2">No repository selected</p>
                <p class="small">Navigate to a repository to use the file explorer</p>
            </div>
        </div>
    </div>
    <!-- Backdrop overlay -->
    <div v-if="isVisible" class="offcanvas-backdrop fade show" @click="close"></div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import FileExplorer from './FileExplorer.vue'

export default {
    name: 'OffcanvasFileExplorer',
    components: {
        FileExplorer
    },
    props: {
        visible: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'file-selected'],
    setup(props, { emit }) {
        const route = useRoute()
        const isVisible = ref(false)

        // Get repository info from route params
        const repositoryInfo = computed(() => {
            const { owner, repo, branch } = route.params
            if (owner && repo && branch) {
                return { owner, repo, branch }
            }
            return null
        })

        // ESC key handler
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isVisible.value) {
                close()
            }
        }

        // Watch for prop changes
        watch(() => props.visible, (newVal) => {
            isVisible.value = newVal
            if (newVal) {
                document.body.classList.add('offcanvas-open')
                document.addEventListener('keydown', handleEscKey)
            } else {
                document.body.classList.remove('offcanvas-open')
                document.removeEventListener('keydown', handleEscKey)
            }
        }, { immediate: true })

        onUnmounted(() => {
            document.removeEventListener('keydown', handleEscKey)
            document.body.classList.remove('offcanvas-open')
        })

        const close = () => {
            isVisible.value = false
            document.body.classList.remove('offcanvas-open')
            document.removeEventListener('keydown', handleEscKey)
            emit('close')
        }

        const onFileSelected = (fileInfo) => {
            // Close the offcanvas when a file is selected (unless opening in new tab)
            if (!fileInfo.newTab) {
                close()
            }
            emit('file-selected', fileInfo)
        }

        return {
            isVisible,
            repositoryInfo,
            close,
            onFileSelected
        }
    }
}
</script>

<style scoped>
.offcanvas {
    width: 400px;
}

.offcanvas-body {
    overflow-y: auto;
}

:deep(.container) {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
}

:deep(.row) {
    margin: 0 !important;
}

:deep(.col-12) {
    padding: 0 !important;
}

:deep(.card) {
    border: none !important;
    border-radius: 0 !important;
}

:deep(.card-header) {
    padding: 1rem !important;
    border-bottom: 1px solid var(--bs-border-color) !important;
}

:deep(.card-body) {
    padding: 0 !important;
}

:deep(.list-group-item) {
    border-left: none !important;
    border-right: none !important;
    border-radius: 0 !important;
}

/* Global style for body when offcanvas is open */
:global(body.offcanvas-open) {
    overflow: hidden;
}
</style>
