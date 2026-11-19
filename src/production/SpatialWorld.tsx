import React from 'react';
import { linearTiming, TransitionSeries, type TransitionPresentationComponentProps } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { AbsoluteFill } from 'remotion';
import { whipPan } from '../components/remocn/whip-pan';
import { focusPull } from '../components/remocn/focus-pull';
import { pushThrough } from '../components/remocn/push-through';
import { hyperspace } from '../components/remocn/hyperspace';
import { glitchCut } from '../components/remocn/glitch-cut';
import { particleDissolve } from '../components/remocn/particle-dissolve';
import brand from '../../brand.config.json';
import type { ShotTransition } from './types';
import { transitionDuration, transitionEasing } from './camera-motion.mjs';

const C = brand.palette;

const DepthPresentation: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress }) => {
  const entering = presentationDirection === 'entering';
  return <AbsoluteFill style={{ opacity: entering ? presentationProgress : 1 - presentationProgress, scale: entering ? 1.08 - .08 * presentationProgress : 1 - .08 * presentationProgress, willChange: 'scale, opacity' }}>
    {children}
  </AbsoluteFill>;
};

export const makeSceneTransition = (spec: ShotTransition | undefined, key: string): React.ReactElement | null => {
  if (!spec || spec.style === 'cut') return null;
  const timing = linearTiming({ durationInFrames: transitionDuration(spec), easing: transitionEasing });
  if (spec.style === 'fade') return <TransitionSeries.Transition key={key} presentation={fade()} timing={timing} />;
  if (spec.style === 'slide') return <TransitionSeries.Transition key={key} presentation={slide({ direction: `from-${spec.from}` })} timing={timing} />;
  if (spec.style === 'depth') return <TransitionSeries.Transition key={key} presentation={{ component: DepthPresentation, props: {} }} timing={timing} />;
  if (spec.style === 'whip') return <TransitionSeries.Transition key={key} presentation={whipPan({ direction: spec.direction, blur: 20 })} timing={timing} />;
  if (spec.style === 'focus') return <TransitionSeries.Transition key={key} presentation={focusPull({ blur: 12 })} timing={timing} />;
  if (spec.style === 'push') return <TransitionSeries.Transition key={key} presentation={pushThrough({ zoom: 1.85, blur: 10 })} timing={timing} />;
  if (spec.style === 'glitch') return <TransitionSeries.Transition key={key} presentation={glitchCut({ intensity: 1, slices: 22, rgbSplit: .9 })} timing={timing} />;
  if (spec.style === 'particle') return <TransitionSeries.Transition key={key} presentation={particleDissolve({ direction: 'up', particleSize: 5, scatter: .1 })} timing={timing} />;
  return <TransitionSeries.Transition key={key} presentation={hyperspace({ stars: 150, accentColor: C.accent, accentRatio: .05, flashColor: C.paper })} timing={timing} />;
};
