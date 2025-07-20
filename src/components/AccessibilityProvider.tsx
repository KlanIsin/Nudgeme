// Accessibility Provider for NudgeMe
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export interface AccessibilityConfig {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  voiceCommands: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
  dyslexiaSupport: boolean;
  autoReadAloud: boolean;
}

export interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  speakText: (text: string) => void;
  setFocus: (elementId: string) => void;
  getFocusableElements: () => HTMLElement[];
  isKeyboardNavigating: boolean;
  currentFocusIndex: number;
  navigateWithKeyboard: (direction: 'next' | 'previous' | 'first' | 'last') => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReducedMotion: () => void;
  toggleVoiceCommands: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
  theme: any;
  themes: any;
}

export const AccessibilityProvider = ({ children, theme, themes }: AccessibilityProviderProps) => {
  const [config, setConfig] = useState<AccessibilityConfig>(() => loadAccessibilityConfig());
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (config.voiceCommands && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [config.voiceCommands]);

  // Apply accessibility styles
  useEffect(() => {
    applyAccessibilityStyles();
  }, [config, theme, themes]);

  // Keyboard navigation setup
  useEffect(() => {
    if (config.keyboardNavigation) {
      updateFocusableElements();
    }
  }, [config.keyboardNavigation]);

  // Load accessibility configuration
  function loadAccessibilityConfig(): AccessibilityConfig {
    try {
      const saved = localStorage.getItem('nudgeme_accessibility_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load accessibility config:', error);
    }

    return {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: true,
      voiceCommands: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindSupport: false,
      dyslexiaSupport: false,
      autoReadAloud: false
    };
  }

  // Save accessibility configuration
  const saveAccessibilityConfig = useCallback((newConfig: AccessibilityConfig) => {
    try {
      localStorage.setItem('nudgeme_accessibility_config', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save accessibility config:', error);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveAccessibilityConfig(newConfig);
  }, [config, saveAccessibilityConfig]);

  // Apply accessibility styles to document
  const applyAccessibilityStyles = useCallback(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (config.highContrast) {
      root.style.setProperty('--high-contrast', 'true');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--background-color', '#000000');
      root.style.setProperty('--primary-color', '#ffff00');
      root.style.setProperty('--secondary-color', '#00ffff');
    } else {
      root.style.setProperty('--high-contrast', 'false');
    }

    // Large text mode
    if (config.largeText) {
      root.style.setProperty('--font-size-base', '18px');
      root.style.setProperty('--font-size-large', '22px');
      root.style.setProperty('--font-size-xl', '26px');
    } else {
      root.style.setProperty('--font-size-base', '16px');
      root.style.setProperty('--font-size-large', '18px');
      root.style.setProperty('--font-size-xl', '20px');
    }

    // Reduced motion
    if (config.reducedMotion) {
      root.style.setProperty('--reduced-motion', 'true');
    } else {
      root.style.setProperty('--reduced-motion', 'false');
    }

    // Focus indicators
    if (config.focusIndicators) {
      root.style.setProperty('--focus-visible', '2px solid #007acc');
    } else {
      root.style.setProperty('--focus-visible', 'none');
    }

    // Dyslexia support
    if (config.dyslexiaSupport) {
      root.style.setProperty('--font-family', 'OpenDyslexic, Arial, sans-serif');
      root.style.setProperty('--line-height', '1.5');
      root.style.setProperty('--letter-spacing', '0.1em');
    } else {
      root.style.setProperty('--font-family', 'system-ui, -apple-system, sans-serif');
      root.style.setProperty('--line-height', '1.4');
      root.style.setProperty('--letter-spacing', 'normal');
    }

    // Color blind support
    if (config.colorBlindSupport) {
      root.style.setProperty('--color-blind-mode', 'true');
    } else {
      root.style.setProperty('--color-blind-mode', 'false');
    }
  }, [config]);

  // Announce to screen reader
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!config.screenReader) return;

    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear the message after a short delay
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [config.screenReader]);

  // Speak text using speech synthesis
  const speakText = useCallback((text: string) => {
    if (!speechSynthesis || !config.autoReadAloud) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    speechSynthesis.speak(utterance);
  }, [speechSynthesis, config.autoReadAloud]);

  // Set focus to specific element
  const setFocus = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Update focusable elements list
  const updateFocusableElements = useCallback(() => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = document.querySelectorAll(focusableSelectors.join(', '));
    focusableElementsRef.current = Array.from(elements) as HTMLElement[];
  }, []);

  // Get focusable elements
  const getFocusableElements = useCallback(() => {
    return focusableElementsRef.current;
  }, []);

  // Navigate with keyboard
  const navigateWithKeyboard = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let newIndex = currentFocusIndex;

    switch (direction) {
      case 'next':
        newIndex = (currentFocusIndex + 1) % elements.length;
        break;
      case 'previous':
        newIndex = currentFocusIndex === 0 ? elements.length - 1 : currentFocusIndex - 1;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = elements.length - 1;
        break;
    }

    setCurrentFocusIndex(newIndex);
    elements[newIndex]?.focus();
    
    // Announce the focused element
    const focusedElement = elements[newIndex];
    if (focusedElement) {
      const label = focusedElement.getAttribute('aria-label') || 
                   focusedElement.getAttribute('title') || 
                   focusedElement.textContent || 
                   focusedElement.tagName.toLowerCase();
      announceToScreenReader(`Focused on ${label}`);
    }
  }, [currentFocusIndex, getFocusableElements, announceToScreenReader]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((command: string) => {
    console.log('Voice command received:', command);
    
    // Navigation commands
    if (command.includes('go to') || command.includes('navigate to')) {
      if (command.includes('overview') || command.includes('home')) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'overview' }));
        announceToScreenReader('Navigating to overview');
      } else if (command.includes('focus')) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'focus' }));
        announceToScreenReader('Navigating to focus section');
      } else if (command.includes('wellness')) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'wellness' }));
        announceToScreenReader('Navigating to wellness section');
      }
    }
    
    // Action commands
    else if (command.includes('start focus') || command.includes('begin focus')) {
      window.dispatchEvent(new CustomEvent('startFocusSession'));
      announceToScreenReader('Starting focus session');
    }
    else if (command.includes('add task') || command.includes('create task')) {
      window.dispatchEvent(new CustomEvent('addTask'));
      announceToScreenReader('Opening add task dialog');
    }
    else if (command.includes('check mood') || command.includes('mood check')) {
      window.dispatchEvent(new CustomEvent('openMoodCheckin'));
      announceToScreenReader('Opening mood check-in');
    }
    else if (command.includes('stop listening') || command.includes('disable voice')) {
      toggleVoiceCommands();
      announceToScreenReader('Voice commands disabled');
    }
    
    // Help command
    else if (command.includes('help') || command.includes('what can I say')) {
      announceToScreenReader('Available commands: go to overview, start focus, add task, check mood, stop listening');
    }
  }, [announceToScreenReader]);

  // Toggle functions
  const toggleHighContrast = useCallback(() => {
    updateConfig({ highContrast: !config.highContrast });
    announceToScreenReader(`High contrast mode ${!config.highContrast ? 'enabled' : 'disabled'}`);
  }, [config.highContrast, updateConfig, announceToScreenReader]);

  const toggleLargeText = useCallback(() => {
    updateConfig({ largeText: !config.largeText });
    announceToScreenReader(`Large text mode ${!config.largeText ? 'enabled' : 'disabled'}`);
  }, [config.largeText, updateConfig, announceToScreenReader]);

  const toggleReducedMotion = useCallback(() => {
    updateConfig({ reducedMotion: !config.reducedMotion });
    announceToScreenReader(`Reduced motion mode ${!config.reducedMotion ? 'enabled' : 'disabled'}`);
  }, [config.reducedMotion, updateConfig, announceToScreenReader]);

  const toggleVoiceCommands = useCallback(() => {
    const newVoiceCommands = !config.voiceCommands;
    updateConfig({ voiceCommands: newVoiceCommands });
    
    if (newVoiceCommands && recognition) {
      recognition.start();
      setIsListening(true);
      announceToScreenReader('Voice commands enabled. Say "help" for available commands.');
    } else if (recognition) {
      recognition.stop();
      setIsListening(false);
      announceToScreenReader('Voice commands disabled');
    }
  }, [config.voiceCommands, recognition, updateConfig, announceToScreenReader]);

  // Keyboard shortcuts
  useHotkeys('alt+1', () => toggleHighContrast());
  useHotkeys('alt+2', () => toggleLargeText());
  useHotkeys('alt+3', () => toggleReducedMotion());
  useHotkeys('alt+v', () => toggleVoiceCommands());
  useHotkeys('tab', () => setIsKeyboardNavigating(true));
  useHotkeys('escape', () => setIsKeyboardNavigating(false));
  useHotkeys('f6', () => navigateWithKeyboard('next'));
  useHotkeys('shift+f6', () => navigateWithKeyboard('previous'));
  useHotkeys('home', () => navigateWithKeyboard('first'));
  useHotkeys('end', () => navigateWithKeyboard('last'));

  // Context value
  const contextValue: AccessibilityContextType = {
    config,
    updateConfig,
    announceToScreenReader,
    speakText,
    setFocus,
    getFocusableElements,
    isKeyboardNavigating,
    currentFocusIndex,
    navigateWithKeyboard,
    toggleHighContrast,
    toggleLargeText,
    toggleReducedMotion,
    toggleVoiceCommands
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />

      {/* Voice command indicator */}
      {isListening && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#007acc',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 20,
            fontSize: '0.8em',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ff4444',
            animation: 'pulse 1s infinite'
          }} />
          Listening...
        </div>
      )}

      {/* Accessibility toolbar */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 8,
          zIndex: 1000,
          display: 'flex',
          gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <button
          onClick={toggleHighContrast}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: config.highContrast ? '#007acc' : '#fff',
            color: config.highContrast ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
          aria-label="Toggle high contrast mode"
        >
          HC
        </button>
        <button
          onClick={toggleLargeText}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: config.largeText ? '#007acc' : '#fff',
            color: config.largeText ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
          aria-label="Toggle large text mode"
        >
          LT
        </button>
        <button
          onClick={toggleVoiceCommands}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: config.voiceCommands ? '#007acc' : '#fff',
            color: config.voiceCommands ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
          aria-label="Toggle voice commands"
        >
          VC
        </button>
      </div>

      {children}

      {/* Global CSS for accessibility */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        /* High contrast mode */
        [data-high-contrast="true"] {
          --text-color: #ffffff !important;
          --background-color: #000000 !important;
          --primary-color: #ffff00 !important;
          --secondary-color: #00ffff !important;
        }

        /* Large text mode */
        [data-large-text="true"] {
          font-size: 18px !important;
        }

        /* Reduced motion */
        [data-reduced-motion="true"] * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* Focus indicators */
        [data-focus-indicators="true"] *:focus-visible {
          outline: 2px solid #007acc !important;
          outline-offset: 2px !important;
        }

        /* Dyslexia support */
        [data-dyslexia-support="true"] {
          font-family: OpenDyslexic, Arial, sans-serif !important;
          line-height: 1.5 !important;
          letter-spacing: 0.1em !important;
        }

        /* Color blind support */
        [data-color-blind="true"] {
          filter: grayscale(100%) !important;
        }

        /* Keyboard navigation indicator */
        [data-keyboard-navigating="true"] *:focus {
          outline: 3px solid #ff6b6b !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider; 