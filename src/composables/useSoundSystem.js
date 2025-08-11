let successSound = null;
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
        successSound = new Howl({
            src: ['assets/sounds/625174__gabfitzgerald__ui-sound-approval-high-pitched-bell-synth.mp3'],
            volume: 0.1,
            preload: true,
            onloaderror: (id, error) => {
                console.warn('Error loading success sound:', error);
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
    const playSuccessSound = () => {
        if (soundEnabled.value && successSound) {
            console.log("KORKOR")
            // Debug: log Howler state and sound properties
            console.log('Howler state:', successSound.state());
            console.log('successSound loaded:', successSound._loaded);
            console.log('successSound src:', successSound._src);
            const id = successSound.play();
            if (typeof id !== 'number') {
                console.log('Howler play() did not return a sound id:', id);
            } else {
                console.log('Howler play() returned id:', id);
            }
        }
    };

    return {
        isSoundEnabled,
        toggleSound,
        playErrorSound,
        playSuccessSound
    };
}
