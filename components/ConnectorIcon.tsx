
import React from 'react';
import { Zap, BatteryCharging, Plug, LucideProps, Power } from 'lucide-react';

interface ConnectorIconProps extends LucideProps {
  type: string;
}

const ConnectorIcon: React.FC<ConnectorIconProps> = ({ type, ...props }) => {
  const normalized = type.toUpperCase();
  
  if (normalized.includes('CCS')) {
    return <Zap {...props} className={`text-orange-500 ${props.className || ''}`} />;
  }
  
  if (normalized.includes('CHADEMO')) {
    return <BatteryCharging {...props} className={`text-blue-500 ${props.className || ''}`} />;
  }
  
  if (normalized.includes('GBT')) {
    return <Power {...props} className={`text-purple-500 ${props.className || ''}`} />;
  }
  
  if (normalized.includes('J1772') || normalized.includes('TYPE 1') || normalized.includes('AC') || normalized.includes('TYPE 2')) {
    return <Plug {...props} className={`text-emerald-500 ${props.className || ''}`} />;
  }
  
  return <Zap {...props} className={`text-slate-400 ${props.className || ''}`} />;
};

export default ConnectorIcon;
