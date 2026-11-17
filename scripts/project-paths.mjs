import { existsSync, readFileSync } from 'node:fs';

export const episodeId = episode => {
  if (!/^[1-9]\d{0,3}$/.test(String(episode))) throw new Error('期数必须是1–9999的整数');
  return `ep${String(episode).padStart(2, '0')}`;
};
export const getEpisodePaths = (episode, edition) => {
  const current = existsSync('episode.config.json') ? JSON.parse(readFileSync('episode.config.json', 'utf8')) : { episode: 1 };
  const selected = episode ?? current.episode;
  const id = episodeId(selected);
  if (edition !== undefined && !/^[a-z][a-z0-9-]*$/.test(edition)) throw new Error('Invalid edition name');
  const motionSrc = edition ? `${id}/${edition}/motion.json` : Number(selected) === Number(current.episode) && current.motionSrc ? current.motionSrc : `${id}/journal/motion.json`;
  const [manifestId, manifestEdition, manifestFile, extra] = String(motionSrc).split('/');
  if (manifestId !== id || !/^[a-z][a-z0-9-]*$/.test(manifestEdition ?? '') || manifestFile !== 'motion.json' || extra !== undefined) throw new Error('Invalid episode manifest path; choose a v2 edition');
  const assetPrefix = motionSrc.slice(0, -'/motion.json'.length);
  const selectedEdition = assetPrefix.split('/').at(-1);
  return { episode: Number(selected), id, edition: selectedEdition,
    assets: `public/${assetPrefix}`, motion: `public/${motionSrc}`, motionSrc,
    video: `public/${assetPrefix}/program.mp4`, videoSrc: `${assetPrefix}/program.mp4`,
    output: `output/${id}`, work: `output/_work/${id}/${selectedEdition}`, cache: 'public/_cache' };
};
