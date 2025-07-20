import React, { useState, useEffect, useMemo } from 'react';
import type { Pattern, MoodEntry, Distraction, SensoryCheckin, SocialEntry, FocusSession } from '../types';
import { IconBrain, IconTrendingUp, IconAlertTriangle, IconBulb } from '@tabler/icons-react';

const PatternRecognition = ({ 
  moods, 
  distractions, 
  sensoryCheckins, 
  socialEntries, 
  focusSessions, 
  theme, 
  themes 
}: { 
  moods: MoodEntry[], 
  distractions: Distraction[], 
  sensoryCheckins: SensoryCheckin[], 
  socialEntries: SocialEntry[], 
  focusSessions: FocusSession[], 
  theme: any, 
  themes: any 
}) => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Pattern['category'] | 'all'>('all');

  // Automatic pattern detection
  useEffect(() => {
    const detectPatterns = () => {
      const newPatterns: Pattern[] = [];
      
      // Mood-Triggered Distraction Patterns
      const moodDistractionPatterns = detectMoodDistractionPatterns(moods, distractions);
      newPatterns.push(...moodDistractionPatterns);
      
      // Sensory Overload Patterns
      const sensoryPatterns = detectSensoryPatterns(sensoryCheckins);
      newPatterns.push(...sensoryPatterns);
      
      // Social Energy Patterns
      const socialPatterns = detectSocialPatterns(socialEntries);
      newPatterns.push(...socialPatterns);
      
      // Focus Session Patterns
      const focusPatterns = detectFocusPatterns(focusSessions);
      newPatterns.push(...focusPatterns);
      
      setPatterns(newPatterns);
    };

    detectPatterns();
  }, [moods, distractions, sensoryCheckins, socialEntries, focusSessions]);

  const detectMoodDistractionPatterns = (moods: MoodEntry[], distractions: Distraction[]): Pattern[] => {
    const patterns: Pattern[] = [];
    
    // High anxiety → digital distractions
    const highAnxietyMoments = moods.filter(m => m.primary === 'anxious' && m.intensity >= 7);
    const anxietyDistractionCount = highAnxietyMoments.filter(moment => {
      const subsequentDistractions = distractions.filter(d => 
        d.timestamp > moment.timestamp && 
        d.timestamp < moment.timestamp + 30 * 60 * 1000 && // within 30 mins
        d.type === 'digital'
      );
      return subsequentDistractions.length > 0;
    }).length;
    
    if (anxietyDistractionCount >= 3) {
      patterns.push({
        id: `anxiety-digital-${Date.now()}`,
        name: 'Anxiety → Digital Distraction',
        description: 'High anxiety often leads to digital distractions within 30 minutes',
        category: 'productivity',
        triggers: ['High anxiety (intensity 7+)'],
        behaviors: ['Seeking digital distractions', 'Phone checking', 'Social media browsing'],
        outcomes: ['Reduced productivity', 'Increased anxiety', 'Time waste'],
        frequency: anxietyDistractionCount,
        confidence: Math.min(anxietyDistractionCount * 20, 90),
        lastObserved: Math.max(...highAnxietyMoments.map(m => m.timestamp)),
        insights: 'Your brain seeks quick dopamine hits when anxious. Consider grounding techniques instead.',
        recommendations: [
          'Try 5-4-3-2-1 grounding exercise',
          'Use fidget tools instead of phone',
          'Take 3 deep breaths before reaching for phone',
          'Set phone to grayscale during anxious periods'
        ],
        isActive: true
      });
    }
    
    return patterns;
  };

  const detectSensoryPatterns = (sensoryCheckins: SensoryCheckin[]): Pattern[] => {
    const patterns: Pattern[] = [];
    
    // Overload patterns by type
    const overloadByType = sensoryCheckins
      .filter(s => s.overloadWarning)
      .reduce((acc, s) => {
        acc[s.sensoryType] = (acc[s.sensoryType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    Object.entries(overloadByType).forEach(([type, count]) => {
      if (count >= 3) {
        patterns.push({
          id: `sensory-overload-${type}-${Date.now()}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensory Overload`,
          description: `Frequent ${type} sensory overload detected`,
          category: 'sensory',
          triggers: [`High ${type} stimulation`, 'Crowded environments', 'Long exposure'],
          behaviors: ['Seeking quiet', 'Avoiding triggers', 'Using regulation tools'],
          outcomes: ['Reduced focus', 'Increased stress', 'Need for recovery'],
          frequency: count,
          confidence: Math.min(count * 25, 85),
          lastObserved: Math.max(...sensoryCheckins.filter(s => s.sensoryType === type).map(s => s.timestamp)),
          insights: `Your ${type} system is highly sensitive. Plan ahead for high-stimulation environments.`,
          recommendations: [
            `Pack ${type} regulation tools`,
            'Plan quiet breaks',
            'Use noise-cancelling headphones',
            'Choose less stimulating environments when possible'
          ],
          isActive: true
        });
      }
    });
    
    return patterns;
  };

  const detectSocialPatterns = (socialEntries: SocialEntry[]): Pattern[] => {
    const patterns: Pattern[] = [];
    
    // Energy drain patterns
    const energyDrainEvents = socialEntries.filter(s => s.energyImpact < 3);
    if (energyDrainEvents.length >= 3) {
      const commonTriggers = energyDrainEvents
        .flatMap(s => s.triggers)
        .reduce((acc, trigger) => {
          acc[trigger] = (acc[trigger] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const topTriggers = Object.entries(commonTriggers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([trigger]) => trigger);
      
      patterns.push({
        id: `social-energy-drain-${Date.now()}`,
        name: 'Social Energy Drain',
        description: 'Certain social situations consistently drain your energy',
        category: 'social',
        triggers: topTriggers,
        behaviors: ['Withdrawal', 'Reduced engagement', 'Seeking solitude'],
        outcomes: ['Fatigue', 'Reduced social capacity', 'Need for recovery'],
        frequency: energyDrainEvents.length,
        confidence: Math.min(energyDrainEvents.length * 20, 80),
        lastObserved: Math.max(...energyDrainEvents.map(s => s.timestamp)),
        insights: 'You have clear social energy boundaries. Honor them to maintain well-being.',
        recommendations: [
          'Plan recovery time after draining events',
          'Set clear boundaries with energy-draining people',
          'Practice saying "no" to preserve energy',
          'Schedule energizing social activities'
        ],
        isActive: true
      });
    }
    
    return patterns;
  };

  const detectFocusPatterns = (focusSessions: FocusSession[]): Pattern[] => {
    const patterns: Pattern[] = [];
    
    // Optimal focus time patterns
    const successfulSessions = focusSessions.filter(s => s.completed && s.duration >= 25);
    if (successfulSessions.length >= 3) {
      const timeOfDay = successfulSessions.map(s => new Date(s.startTime).getHours());
      const mostCommonHour = timeOfDay.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const optimalHour = Object.entries(mostCommonHour)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      patterns.push({
        id: `optimal-focus-time-${Date.now()}`,
        name: 'Optimal Focus Time',
        description: `You're most productive during ${optimalHour}:00`,
        category: 'focus',
        triggers: [`Time of day: ${optimalHour}:00`, 'Good sleep', 'Low distractions'],
        behaviors: ['Deep work', 'High concentration', 'Task completion'],
        outcomes: ['High productivity', 'Quality work', 'Sense of accomplishment'],
        frequency: successfulSessions.length,
        confidence: Math.min(successfulSessions.length * 25, 90),
        lastObserved: Math.max(...successfulSessions.map(s => s.startTime)),
        insights: 'Your circadian rhythm has a clear peak. Schedule important work during this window.',
        recommendations: [
          `Schedule deep work for ${optimalHour}:00`,
          'Protect this time from meetings',
          'Prepare tasks the night before',
          'Minimize distractions during this window'
        ],
        isActive: true
      });
    }
    
    return patterns;
  };

  const filteredPatterns = useMemo(() => {
    if (selectedCategory === 'all') return patterns;
    return patterns.filter(p => p.category === selectedCategory);
  }, [patterns, selectedCategory]);

  const activePatterns = filteredPatterns.filter(p => p.isActive);
  const highConfidencePatterns = activePatterns.filter(p => p.confidence >= 7);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconBrain style={{ marginRight: 8 }} />
        Pattern Recognition
      </h2>
      
      {/* Category Filter */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', 'productivity', 'mood', 'sensory', 'social', 'focus'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? themes[theme].primary : '#f0f0f0',
              color: selectedCategory === cat ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.9em',
              fontWeight: 600
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Pattern Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{activePatterns.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Active Patterns</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#28a745' }}>{highConfidencePatterns.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>High Confidence</div>
        </div>
      </div>

      {/* Patterns List */}
      {activePatterns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconBrain size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No patterns detected yet. Keep logging your data!</p>
          <p style={{ fontSize: '0.9em', marginTop: 8 }}>Patterns will appear after 3+ related events</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activePatterns.map(pattern => (
            <div key={pattern.id} style={{ 
              background: '#fff', 
              borderRadius: 12, 
              padding: 20, 
              boxShadow: '0 2px 8px #0001',
              borderLeft: `4px solid ${pattern.confidence >= 7 ? '#28a745' : '#ffc107'}`
            }}>
              {/* Pattern Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700, color: '#333' }}>
                    {pattern.name}
                  </h3>
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {pattern.category} • {pattern.frequency} occurrences • {pattern.confidence}/10 confidence
                  </div>
                </div>
                <div style={{ 
                  background: pattern.confidence >= 7 ? '#28a745' : '#ffc107', 
                  color: '#fff', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: '0.8em', 
                  fontWeight: 600 
                }}>
                  {pattern.confidence >= 7 ? 'High' : 'Medium'} Confidence
                </div>
              </div>

              {/* Pattern Description */}
              <p style={{ margin: '0 0 12px 0', color: '#555', lineHeight: 1.5 }}>
                {pattern.description}
              </p>

              {/* Pattern Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Triggers</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {pattern.triggers.join(', ')}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Behaviors</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {pattern.behaviors.join(', ')}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Outcomes</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {pattern.outcomes.join(', ')}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <IconBulb size={16} style={{ marginRight: 6, color: themes[theme].primary }} />
                  <span style={{ fontWeight: 600, color: '#333' }}>Insight</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.95em', color: '#555', lineHeight: 1.5 }}>
                  {pattern.insights}
                </p>
              </div>

              {/* Recommendations */}
        <div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: 8 }}>
                  <IconTrendingUp size={16} style={{ marginRight: 6, color: themes[theme].primary }} />
                  Recommendations
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9em', color: '#555' }}>
                  {pattern.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Last Observed */}
              <div style={{ marginTop: 12, fontSize: '0.85em', color: '#888' }}>
                Last observed: {new Date(pattern.lastObserved).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatternRecognition; 