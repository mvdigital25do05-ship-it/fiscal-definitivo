import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface Props {
  initialSeconds?: number; // if set, counts down from initialSeconds
  isCountdown?: boolean;
  onTimeExpired?: () => void;
  onTick?: (seconds: number) => void;
}

export const SimuladoTimer: React.FC<Props> = ({
  initialSeconds = 0,
  isCountdown = false,
  onTimeExpired,
  onTick,
}) => {
  const [seconds, setSeconds] = useState(isCountdown ? initialSeconds : 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (isCountdown) {
          if (prev <= 1) {
            clearInterval(timer);
            if (onTimeExpired) onTimeExpired();
            return 0;
          }
          const next = prev - 1;
          if (onTick) onTick(next);
          return next;
        } else {
          const next = prev + 1;
          if (onTick) onTick(next);
          return next;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdown, onTimeExpired, onTick]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLowTime = isCountdown && seconds > 0 && seconds <= 300; // 5 min or less

  return (
    <div
      id="simulado-timer-badge"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
        isLowTime
          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] animate-pulse'
          : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#1C1917]'
      }`}
      title={isCountdown ? 'Tempo restante' : 'Tempo decorrido'}
    >
      {isLowTime ? <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" /> : <Clock className="w-3.5 h-3.5 text-[#78716C]" />}
      <span className="font-bold">{formatTime(seconds)}</span>
      {isCountdown && <span className="text-[10px] text-[#78716C] font-mono">restante</span>}
    </div>
  );
};

