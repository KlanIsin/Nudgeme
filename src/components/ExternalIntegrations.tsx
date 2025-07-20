import React, { useState, useEffect, useMemo } from 'react';
import type { ExternalIntegration, IntegrationData } from '../types';
import { IconLink, IconCalendar, IconMail, IconNotes, IconHeart, IconCloud, IconCheck, IconX, IconRefresh, IconSettings, IconPlus } from '@tabler/icons-react';

const INTEGRATION_TYPES = [
  { type: 'calendar', name: 'Calendar', icon: IconCalendar, description: 'Sync events and appointments' },
  { type: 'email', name: 'Email', icon: IconMail, description: 'Track important emails and deadlines' },
  { type: 'notes', name: 'Notes', icon: IconNotes, description: 'Sync notes and ideas' },
  { type: 'fitness', name: 'Fitness', icon: IconHeart, description: 'Track health and wellness data' },
  { type: 'weather', name: 'Weather', icon: IconCloud, description: 'Weather impact on mood and energy' },
  { type: 'todo', name: 'Todo Apps', icon: IconCheck, description: 'Sync tasks from other apps' },
  { type: 'habit', name: 'Habit Trackers', icon: IconRefresh, description: 'Import habit data' },
] as const;

const ExternalIntegrations = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>(() => {
    const raw = localStorage.getItem('externalIntegrations');
    return raw ? JSON.parse(raw) : [];
  });

  const [integrationData, setIntegrationData] = useState<IntegrationData[]>(() => {
    const raw = localStorage.getItem('integrationData');
    return raw ? JSON.parse(raw) : [];
  });

  const [connectionModal, setConnectionModal] = useState<string | null>(null);
  const [settingsModal, setSettingsModal] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    localStorage.setItem('externalIntegrations', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    localStorage.setItem('integrationData', JSON.stringify(integrationData));
  }, [integrationData]);

  const connectIntegration = (type: ExternalIntegration['type'], name: string) => {
    if (!apiKeyInput.trim()) {
      showToast('Please enter an API key', 'error');
      return;
    }

    const newIntegration: ExternalIntegration = {
      id: Date.now().toString(),
      name,
      type,
      apiKey: apiKeyInput,
      isConnected: true,
      lastSync: Date.now(),
      settings: {},
      syncFrequency: 30, // 30 minutes default
    };

    setIntegrations(prev => [newIntegration, ...prev]);
    setConnectionModal(null);
    setApiKeyInput('');
    showToast(`${name} connected successfully!`, 'success');

    // Simulate initial data sync
    setTimeout(() => {
      simulateDataSync(newIntegration.id, type);
    }, 1000);
  };

  const disconnectIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration =>
      integration.id === integrationId
        ? { ...integration, isConnected: false }
        : integration
    ));
    showToast('Integration disconnected', 'info');
  };

  const syncIntegration = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIntegrations(prev => prev.map(i =>
      i.id === integrationId
        ? { ...i, lastSync: Date.now() }
        : i
    ));

    // Simulate data sync
    simulateDataSync(integrationId, integration.type);
    showToast('Sync completed!', 'success');
  };

  const simulateDataSync = (integrationId: string, type: ExternalIntegration['type']) => {
    const mockData: Record<string, any> = {};
    
    switch (type) {
      case 'calendar':
        mockData.events = [
          { title: 'Team Meeting', time: '10:00 AM', duration: 60 },
          { title: 'Doctor Appointment', time: '2:00 PM', duration: 30 },
        ];
        break;
      case 'email':
        mockData.emails = [
          { subject: 'Project Update', sender: 'boss@company.com', unread: true },
          { subject: 'Meeting Notes', sender: 'team@company.com', unread: false },
        ];
        break;
      case 'fitness':
        mockData.metrics = [
          { type: 'steps', value: 8500, goal: 10000 },
          { type: 'sleep', value: 7.5, goal: 8 },
        ];
        break;
      case 'weather':
        mockData.forecast = [
          { day: 'Today', temp: 72, condition: 'Sunny', impact: 'High energy' },
          { day: 'Tomorrow', temp: 68, condition: 'Cloudy', impact: 'Moderate energy' },
        ];
        break;
      default:
        mockData.items = [
          { title: 'Sample Item 1', status: 'pending' },
          { title: 'Sample Item 2', status: 'completed' },
        ];
    }

    const newData: IntegrationData = {
      id: Date.now().toString(),
      integrationId,
      data: mockData,
      timestamp: Date.now(),
      type: type === 'calendar' ? 'event' : type === 'fitness' ? 'metric' : 'task',
    };

    setIntegrationData(prev => [newData, ...prev]);
  };

  const getIntegrationIcon = (type: ExternalIntegration['type']) => {
    const integration = INTEGRATION_TYPES.find(i => i.type === type);
    return integration?.icon || IconLink;
  };

  const getIntegrationName = (type: ExternalIntegration['type']) => {
    const integration = INTEGRATION_TYPES.find(i => i.type === type);
    return integration?.name || type;
  };

  const getIntegrationDescription = (type: ExternalIntegration['type']) => {
    const integration = INTEGRATION_TYPES.find(i => i.type === type);
    return integration?.description || 'External data integration';
  };

  const getLastSyncText = (lastSync: number) => {
    const diff = Date.now() - lastSync;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getDataPreview = (integrationId: string) => {
    const latestData = integrationData
      .filter(d => d.integrationId === integrationId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!latestData) return 'No data yet';

    const data = latestData.data;
    const keys = Object.keys(data);
    
    if (keys.length === 0) return 'No data yet';
    
    const firstKey = keys[0];
    const items = Array.isArray(data[firstKey]) ? data[firstKey] : [];
    
    if (items.length === 0) return 'No items';
    
    return `${items.length} ${firstKey} synced`;
  };

  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const availableIntegrations = INTEGRATION_TYPES.filter(
    type => !integrations.some(i => i.type === type.type && i.isConnected)
  );

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconLink style={{ marginRight: 8 }} />
        External Integrations
      </h2>

      {/* Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{connectedIntegrations.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Connected</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#28a745' }}>{integrationData.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Data Points</div>
        </div>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: 12, color: '#333' }}>Connected Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {connectedIntegrations.map(integration => {
              const IconComponent = getIntegrationIcon(integration.type);
              
              return (
                <div key={integration.id} style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 8px #0001',
                  borderLeft: `4px solid ${themes[theme].primary}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        background: themes[theme].primary,
                        color: '#fff',
                        borderRadius: 8,
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1em', fontWeight: 600, color: '#333' }}>
                          {integration.name}
                        </h4>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {getIntegrationDescription(integration.type)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => syncIntegration(integration.id)}
                        style={{
                          background: '#f8f9fa',
                          color: '#333',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '0.85em',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <IconRefresh size={14} />
                        Sync
                      </button>
                      <button
                        onClick={() => setSettingsModal(integration.id)}
                        style={{
                          background: '#f8f9fa',
                          color: '#333',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '0.85em',
                          fontWeight: 600
                        }}
                      >
                        <IconSettings size={14} />
                      </button>
                      <button
                        onClick={() => disconnectIntegration(integration.id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '0.85em',
                          fontWeight: 600
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em', color: '#666' }}>
                    <span>Last sync: {getLastSyncText(integration.lastSync)}</span>
                    <span>{getDataPreview(integration.id)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      {availableIntegrations.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: 12, color: '#333' }}>Available Integrations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {availableIntegrations.map(integration => {
              const IconComponent = integration.icon;
              
              return (
                <div key={integration.type} style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 8px #0001',
                  border: '2px dashed #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setConnectionModal(integration.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = themes[theme].primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ddd';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                      background: '#f8f9fa',
                      color: '#666',
                      borderRadius: 8,
                      padding: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1em', fontWeight: 600, color: '#333' }}>
                        {integration.name}
                      </h4>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {integration.description}
                      </div>
                    </div>
                  </div>
                  <button
                    style={{
                      background: themes[theme].primary,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <IconPlus size={14} />
                    Connect
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {connectionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400 }}>
            <h3>Connect {getIntegrationName(connectionModal)}</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: 16 }}>
              {getIntegrationDescription(connectionModal)}
            </p>
            <form onSubmit={e => {
              e.preventDefault();
              connectIntegration(connectionModal, getIntegrationName(connectionModal));
            }}>
              <label>API Key:
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Enter your API key"
                />
              </label>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setConnectionModal(null)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Integration Settings</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: 16 }}>
              Configure sync frequency and other settings for this integration.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setSettingsModal(null)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Integrations State */}
      {integrations.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconLink size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No integrations connected yet. Connect your favorite apps to sync data!</p>
        </div>
      )}
    </div>
  );
};

export default ExternalIntegrations; 