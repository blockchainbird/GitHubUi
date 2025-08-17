import { ref, watch } from 'vue'

// Singleton reactive state for Advanced User mode
const isAdvancedUser = ref(true)

// Initialize from localStorage once on first import
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('advancedUser') : null
if (stored !== null) {
    isAdvancedUser.value = stored === 'true'
}

// Persist changes to localStorage
watch(isAdvancedUser, (val) => {
    try {
        localStorage.setItem('advancedUser', val ? 'true' : 'false')
    } catch (_) {
        // ignore storage errors
    }
}, { immediate: false })

export function useAdvancedUser() {
    const setAdvancedUser = (val) => { isAdvancedUser.value = !!val }
    const toggleAdvancedUser = () => { isAdvancedUser.value = !isAdvancedUser.value }
    return { isAdvancedUser, setAdvancedUser, toggleAdvancedUser }
}
