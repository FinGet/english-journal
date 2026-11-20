import React from "react";
import { Composition } from "remotion";
import { CharacterSheet } from "./kit/character/CharacterSheet";
import { loadEpisode, type EpisodeEntry, type EpisodeProps } from "./kit/EpisodeData";
import { KitPreview } from "./kit/KitPreview";
import { BlocksGallery, GALLERY_FRAMES } from "./kit/blocks/Gallery";

// Episodes are personal and not in git. Every src/episodes/<slug>/Episode.tsx that exists locally
// exports `episode` and is registered here automatically; a fresh clone simply has none.
const ctx = require.context("./episodes", true, /\/Episode\.tsx$/);
const EPISODES = ctx
  .keys()
  .map((k) => (ctx(k) as { episode?: EpisodeEntry }).episode)
  .filter((e): e is EpisodeEntry => Boolean(e))
  .sort((a, b) => a.id.localeCompare(b.id));

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((e) => (
        <Composition
          key={e.id}
          id={e.id}
          component={e.component}
          defaultProps={{ dir: e.dir, data: null } satisfies EpisodeProps}
          calculateMetadata={loadEpisode}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      <Composition
        id="CharacterSheet"
        component={CharacterSheet}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BlocksGallery"
        component={BlocksGallery}
        durationInFrames={GALLERY_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="KitPreview"
        component={KitPreview}
        defaultProps={{ dir: "test", data: null } satisfies EpisodeProps}
        calculateMetadata={async (o) => ({ ...(await loadEpisode(o)), durationInFrames: 420 })}
        durationInFrames={420}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
