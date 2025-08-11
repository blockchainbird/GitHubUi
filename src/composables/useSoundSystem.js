import { Howl } from 'howler';
import { ref, computed } from 'vue';

// Global sound state
const soundEnabled = ref(localStorage.getItem('soundEnabled') !== 'false'); // Default ON

// Sound effects
let errorSound = null;

// Initialize sounds
function initializeSounds() {
    try {
        errorSound = new Howl({
            src: ['assets/sounds/542040__rob_marion__gasp_ui_reject.mp3'],
            volume: 0.3,
            preload: true,
            onloaderror: (id, error) => {
                console.warn('Error loading sound:', error);
            }
        });
    } catch (error) {
        console.warn('Failed to initialize sounds:', error);
    }
}

// Initialize sounds on module load
initializeSounds();

export function useSoundSystem() {
    const isSoundEnabled = computed(() => soundEnabled.value);

    const toggleSound = () => {
        soundEnabled.value = !soundEnabled.value;
        localStorage.setItem('soundEnabled', soundEnabled.value.toString());
    };

    const playErrorSound = () => {
        if (soundEnabled.value && errorSound) {
            try {
                errorSound.play();
            } catch (error) {
                console.warn('Error playing sound:', error);
            }
        }
    };

    return {
        isSoundEnabled,
        toggleSound,
        playErrorSound
    };
}
