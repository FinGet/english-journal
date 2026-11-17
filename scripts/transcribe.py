"""Transcribe actual speech with the existing local model; names are vocabulary hints."""
import argparse
import json
import os
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('video', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--vocabulary', default='')
project = Path(__file__).resolve().parents[1]
cached = [project / '.cache/asr-models/whisper-large-v3-turbo', project.parent / 'ai-english-coach/.cache/asr-models/whisper-large-v3-turbo']
local_default = next((p for p in cached if (p / 'weights.safetensors').is_file()), cached[0])
parser.add_argument('--model', type=Path, default=Path(os.environ.get('LOCAL_ASR_MODEL', local_default)))
args = parser.parse_args()
assert args.video.is_file(), 'Input video is missing'
assert not args.output.exists(), 'Preserve the existing transcript; use another output path'
model = args.model.resolve()
assert (model / 'weights.safetensors').is_file(), 'Local model missing; no download attempted'
os.environ['HF_HUB_OFFLINE'] = '1'
import mlx_whisper

result = mlx_whisper.transcribe(
    str(args.video), path_or_hf_repo=str(model), language='en',
    word_timestamps=True, temperature=0.0, condition_on_previous_text=False,
    initial_prompt=args.vocabulary or None,
)
words = [word for segment in result['segments'] for word in segment.get('words', [])]
assert words and all(0 <= word['start'] <= word['end'] for word in words)
result['source'] = str(args.video)
result['vocabulary'] = args.vocabulary
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(result['text'], flush=True)
