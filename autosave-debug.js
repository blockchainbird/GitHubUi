// Autosave Debug Helper
// Copy-paste this into browser console to debug autosave issues

console.log('🔧 Autosave Debug Helper loaded');

// Helper functions to test autosave
window.autosaveDebug = {
  
  // Show all autosave entries in localStorage
  showAutosaveEntries() {
    const autosaveKeys = Object.keys(localStorage).filter(key => key.startsWith('autosave_'));
    console.log('📦 Found autosave entries:', autosaveKeys.length);
    
    autosaveKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`📄 ${key}:`, {
          contentLength: data.content?.length || 0,
          timestamp: new Date(data.timestamp).toLocaleString(),
          isNewFile: data.isNewFile
        });
      } catch (error) {
        console.error(`❌ Error parsing ${key}:`, error);
      }
    });
    
    if (autosaveKeys.length === 0) {
      console.log('🔍 No autosave entries found in localStorage');
    }
  },
  
  // Clear all autosave entries
  clearAllAutosave() {
    const autosaveKeys = Object.keys(localStorage).filter(key => key.startsWith('autosave_'));
    autosaveKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log(`🗑️ Cleared ${autosaveKeys.length} autosave entries`);
  },
  
  // Test if Vue app is accessible
  testVueApp() {
    const app = document.querySelector('#app');
    if (app && app.__vue_app__) {
      console.log('✅ Vue app found and accessible');
      return true;
    } else {
      console.log('❌ Vue app not found or not accessible');
      return false;
    }
  },
  
  // Simulate typing to trigger autosave
  simulateTyping() {
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      const textarea = textareas[0];
      const testContent = 'Test autosave content: ' + new Date().toISOString();
      
      // Simulate user input
      textarea.value = testContent;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('⌨️ Simulated typing:', testContent);
      console.log('🔄 Check console for autosave logs in 10 seconds...');
    } else {
      console.log('❌ No textarea found on page');
    }
  },
  
  // Check if autosave system is working
  runFullTest() {
    console.log('🧪 Running full autosave test...');
    
    // 1. Check Vue app
    const hasVue = this.testVueApp();
    
    // 2. Show current autosave entries
    this.showAutosaveEntries();
    
    // 3. Clear old entries
    this.clearAllAutosave();
    
    // 4. Simulate typing if Vue app is available
    if (hasVue) {
      setTimeout(() => {
        this.simulateTyping();
      }, 1000);
    }
    
    console.log('🔍 Test complete. Watch console for autosave activity.');
  }
};

// Auto-run basic test
console.log('🚀 Running basic autosave check...');
autosaveDebug.showAutosaveEntries();

console.log('💡 Available commands:');
console.log('- autosaveDebug.showAutosaveEntries() - Show all autosave data');
console.log('- autosaveDebug.clearAllAutosave() - Clear all autosave data');
console.log('- autosaveDebug.simulateTyping() - Simulate typing in textarea');
console.log('- autosaveDebug.runFullTest() - Run comprehensive test');
