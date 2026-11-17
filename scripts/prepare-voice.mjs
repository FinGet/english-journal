import { parseArgs } from 'node:util';
import { prepareVoice } from './audio.mjs';

const { values } = parseArgs({ options: { input: { type: 'string' }, output: { type: 'string' } } });
if (!values.input || !values.output) throw new Error('Required: npm run voice -- --input denoised-program.mp4 --output path/to/voice.wav');
prepareVoice(values);
