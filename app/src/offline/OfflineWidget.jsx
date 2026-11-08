import { useEffect, useState } from 'react';

const widgetStyle = {
  position: 'fixed',
  bottom: '86px',
  left: '12px',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: '9999px',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  fontWeight: '600',
  pointerEvents: 'none',
  userSelect: 'none',
};

const dotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  display: 'inline-block',
};

export function OfflineWidget() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div style={widgetStyle} role="status" aria-live="polite">
      <span style={dotStyle} />
      <span>Sin conexión</span>
    </div>
  );
}

export default OfflineWidget;
