import React from "react";
import { Composition, staticFile } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import current from "../episode.config.json";
import { JournalFilm, JournalOutro } from "./production/Film";
import type { ProductionProps } from "./production/types";
import { compositionFrames, validateBrand, validateProduction } from "./production/validate.mjs";
import brand from "../brand.config.json";
import project from "../project.config.json";
import { JournalCover } from './production/Cover';
const selected: { episode: number; motionSrc?: string } = current;
const defaultMotionSrc = selected.motionSrc ?? `ep${String(selected.episode).padStart(2, '0')}/journal/motion.json`;

const productionMetadata: CalculateMetadataFunction<ProductionProps> = async (args) => {
  const response = await fetch(staticFile(args.props.motionSrc), { signal: args.abortSignal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Missing episode: ${args.props.motionSrc}`);
  const data = await response.json();
  if (data.format !== 'english-journal/v2') throw new Error('This is a historical episode format. Import it as a new edition with npm run episode:new; original media and archived source are preserved.');
  validateBrand(brand);
  const production = validateProduction(data);
  return { durationInFrames: compositionFrames(production, brand), props: { ...args.props, production } };
};
const coverMetadata: CalculateMetadataFunction<ProductionProps> = async args => ({ ...await productionMetadata(args), durationInFrames: 1 });

export const RemotionRoot: React.FC = () => <>
  <Composition id="EnglishJournal" component={JournalFilm} {...project.video} durationInFrames={30} defaultProps={{ motionSrc: defaultMotionSrc }} calculateMetadata={productionMetadata} />
  <Composition id="JournalCover" component={JournalCover} width={project.cover.width} height={project.cover.height} fps={project.cover.fps} durationInFrames={1} defaultProps={{ motionSrc: defaultMotionSrc }} calculateMetadata={coverMetadata} />
  <Composition id="JournalOutro" component={JournalOutro} {...project.video} durationInFrames={brand.outroFrames} />
</>;
