import React from 'react';

export const DepthStage: React.FC<{ children: React.ReactNode; perspective?: number; origin?: string; style?: React.CSSProperties }> = ({ children, perspective = 1400, origin = '50% 50%', style }) => <div style={{ position: 'relative', ...style, perspective, perspectiveOrigin: origin }}>
  <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>{children}</div>
</div>;

export const DepthLayer: React.FC<{ children: React.ReactNode; x?: number; y?: number; z?: number; rotateX?: number; rotateY?: number; rotateZ?: number; scale?: number; style?: React.CSSProperties }> = ({ children, x = 0, y = 0, z = 0, rotateX = 0, rotateY = 0, rotateZ = 0, scale = 1, style }) => <div style={{ ...style, transformStyle: 'preserve-3d', transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})` }}>
  {children}
</div>;

export const FlipPanel: React.FC<{ front: React.ReactNode; back: React.ReactNode; progress: number; axis?: 'x' | 'y'; perspective?: number; style?: React.CSSProperties; faceStyle?: React.CSSProperties }> = ({ front, back, progress, axis = 'y', perspective = 1100, style, faceStyle }) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const showingFront = clamped < .5;
  const turn = showingFront ? clamped * 180 : (clamped - 1) * 180;
  const rotation = axis === 'x' ? `rotateX(${turn}deg)` : `rotateY(${turn}deg)`;
  return <div style={{ position: 'relative', ...style, perspective }}>
    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: rotation, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, ...faceStyle }}>{showingFront ? front : back}</div>
    </div>
  </div>;
};
