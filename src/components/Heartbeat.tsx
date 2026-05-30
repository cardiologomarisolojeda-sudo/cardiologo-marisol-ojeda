import { motion } from 'motion/react';

interface HeartbeatProps {
  className?: string;
  speed?: number; // duration of animation cycle
  color?: string;
}

export default function Heartbeat({ className = 'h-16 w-full', speed = 2.5, color = 'text-red-500' }: HeartbeatProps) {
  // An elegant SVG heartbeat (P-Q-R-S-T) waveform path
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0.2 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: speed, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' as const },
        opacity: { duration: speed, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' as const }
      }
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 500 100"
        className={`w-full h-full stroke-current ${color}`}
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ambient background grid simulating medical ECG graph paper */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(239, 68, 68, 0.04)" strokeWidth="1" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(239, 68, 68, 0.08)" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Dynamic heartbeat wave */}
        <motion.path
          d="M 0,50 L 150,50 L 165,45 L 180,55 L 195,50 L 210,50 L 220,15 L 235,90 L 245,50 L 260,50 L 280,35 L 300,53 L 310,50 L 500,50"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
        />
        
        {/* Glow effect matching the moving tip */}
        <circle cx="245" cy="50" r="1.5" className="animate-ping fill-red-400 opacity-25" />
      </svg>
    </div>
  );
}
