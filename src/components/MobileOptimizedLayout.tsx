// Mobile-First Responsive Layout with Touch Gestures
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useHotkeys } from 'react-hotkeys-hook';
import { 
  IconMenu2, 
  IconX, 
  IconChevronLeft, 
  IconChevronRight,
  IconHome,
  IconTarget,
  IconBrain,
  IconClock,
  IconTrophy,
  IconBell,
  IconSettings,
  IconPlus,
  IconSearch,
  IconFilter,
  IconRefresh
} from '@tabler/icons-react';

export interface MobileLayoutProps {
  children: React.ReactNode;
  theme: any;
  themes: any;
  onNavigate?: (section: string) => void;
  currentSection?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export interface SwipeAction {
  direction: 'left' | 'right' | 'up' | 'down';
  action: () => void;
  icon?: React.ReactNode;
  label?: string;
  color?: string;
}

const MobileOptimizedLayout = ({
  children,
  theme,
  themes,
  onNavigate,
  currentSection = 'overview',
  showToast
}: MobileLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const layoutRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Navigation sections
  const sections = [
    { id: 'overview', label: 'Overview', icon: IconHome },
    { id: 'focus', label: 'Focus', icon: IconTarget },
    { id: 'wellness', label: 'Wellness', icon: IconBrain },
    { id: 'planning', label: 'Planning', icon: IconClock },
    { id: 'motivation', label: 'Motivation', icon: IconTrophy },
    { id: 'automation', label: 'Automation', icon: IconBell }
  ];

  // Handle scroll events for mobile optimization
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      
      setIsScrolling(true);
      setScrollDirection(direction);
      setLastScrollY(currentScrollY);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);

  // Keyboard shortcuts
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  });

  useHotkeys('escape', () => {
    setSidebarOpen(false);
    setSearchOpen(false);
  });

  // Touch gesture handlers
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    const nextIndex = (currentIndex + 1) % sections.length;
    onNavigate?.(sections[nextIndex].id);
  }, [currentSection, sections, onNavigate]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
    onNavigate?.(sections[prevIndex].id);
  }, [currentSection, sections, onNavigate]);

  const handleSwipeUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSwipeDown = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    onSwipedUp: handleSwipeUp,
    onSwipedDown: handleSwipeDown,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    delta: 50, // Minimum swipe distance
    swipeDuration: 500, // Maximum swipe duration
  });

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // Implement search functionality
    if (showToast) {
      showToast(`Searching for: ${term}`, 'info');
    }
  }, [showToast]);

  // Handle section navigation
  const handleSectionChange = useCallback((sectionId: string) => {
    onNavigate?.(sectionId);
    setSidebarOpen(false);
  }, [onNavigate]);

  // Quick actions
  const quickActions = [
    {
      icon: IconPlus,
      label: 'Add Task',
      action: () => {
        if (showToast) showToast('Quick add task', 'info');
      }
    },
    {
      icon: IconTarget,
      label: 'Start Focus',
      action: () => {
        if (showToast) showToast('Starting focus session', 'info');
      }
    },
    {
      icon: IconBrain,
      label: 'Mood Check',
      action: () => {
        if (showToast) showToast('Opening mood check', 'info');
      }
    }
  ];

  return (
    <div 
      ref={layoutRef}
      style={{
        minHeight: '100vh',
        background: themes[theme].background,
        color: themes[theme].text,
        fontSize: '16px', // Prevent zoom on iOS
        touchAction: 'manipulation', // Optimize touch interactions
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}
      {...swipeHandlers}
    >
      {/* Mobile Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease',
        transform: isScrolling && scrollDirection === 'down' ? 'translateY(-100%)' : 'translateY(0)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          maxWidth: '100vw'
        }}>
          {/* Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              color: themes[theme].primary
            }}
            aria-label="Open menu"
          >
            <IconMenu2 size={24} />
          </button>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: '1.2em',
            fontWeight: 700,
            color: themes[theme].primary,
            flex: 1,
            textAlign: 'center'
          }}>
            NudgeMe
          </h1>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              color: themes[theme].primary
            }}
            aria-label="Search"
          >
            <IconSearch size={24} />
          </button>
        </div>

        {/* Section Indicator */}
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            background: themes[theme].primary,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: '0.8em',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {sections.find(s => s.id === currentSection)?.icon && 
              React.createElement(sections.find(s => s.id === currentSection)!.icon, { size: 14 })
            }
            {sections.find(s => s.id === currentSection)?.label}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 80
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            width: '90%',
            maxWidth: 400
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <IconSearch size={20} color="#666" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search tasks, moods, sessions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1em',
                  padding: 8
                }}
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer'
                }}
              >
                <IconX size={20} />
              </button>
            </div>
            
            {/* Search Filters */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              {['tasks', 'moods', 'sessions', 'goals'].map(filter => (
                <button
                  key={filter}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: 12,
                    background: '#f8f9fa',
                    fontSize: '0.8em',
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: 300,
          background: '#fff',
          zIndex: 1500,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          transform: 'translateX(0)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid #eee'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <h2 style={{ margin: 0, color: themes[theme].primary }}>Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer'
                }}
              >
                <IconX size={24} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ padding: 16 }}>
            {sections.map(section => {
              const IconComponent = section.icon;
              const isActive = section.id === currentSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: isActive ? themes[theme].primary + '20' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: isActive ? themes[theme].primary : '#333',
                    fontWeight: isActive ? 600 : 400,
                    marginBottom: 4
                  }}
                >
                  <IconComponent size={20} />
                  {section.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div style={{
            padding: 16,
            borderTop: '1px solid #eee',
            marginTop: 'auto'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9em', color: '#666' }}>
              Quick Actions
            </h3>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    color: '#666',
                    marginBottom: 4
                  }}
                >
                  <IconComponent size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1400
          }}
        />
      )}

      {/* Main Content */}
      <main style={{
        paddingTop: 120, // Account for fixed header
        paddingBottom: 80, // Account for bottom navigation
        minHeight: '100vh',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #eee',
        zIndex: 1000,
        padding: '8px 0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {sections.slice(0, 5).map(section => {
          const IconComponent = section.icon;
          const isActive = section.id === currentSection;
          
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? themes[theme].primary : '#666',
                fontSize: '0.7em',
                minWidth: 60
              }}
            >
              <IconComponent size={20} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          if (showToast) showToast('Quick action', 'info');
        }}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: themes[theme].primary,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 900,
          transition: 'transform 0.2s ease'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Quick action"
      >
        <IconPlus size={24} />
      </button>

      {/* Swipe Indicators */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: 10,
        transform: 'translateY(-50%)',
        zIndex: 500,
        opacity: 0.3,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: themes[theme].primary,
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 20,
          fontSize: '0.8em',
          marginBottom: 8
        }}>
          ← Swipe
        </div>
      </div>

      <div style={{
        position: 'fixed',
        top: '50%',
        right: 10,
        transform: 'translateY(-50%)',
        zIndex: 500,
        opacity: 0.3,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: themes[theme].primary,
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 20,
          fontSize: '0.8em',
          marginBottom: 8
        }}>
          Swipe →
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedLayout; 