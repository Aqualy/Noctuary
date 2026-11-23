import { Asset } from 'expo-asset';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import type { Mood } from '../moon/moonAnim';
import type { Utterance } from './lexicon';
import { readWav, speak, type Bank } from './synth';

let bank: Promise<Bank> | null = null;
let player: AudioPlayer | null = null;
let count = 0;
let turn = 0; // raised by every hush, so a sentence still being prepared is dropped

function loadBank(): Promise<Bank> {
  bank ??= (async () => {
    const asset = Asset.fromModule(require('../../assets/voice/syllables.wav'));
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('voice not available');
    return readWav(await new File(asset.localUri).bytes());
  })().catch((e) => {
    bank = null; // try again at the next sentence
    throw e;
  });
  return bank;
}

export function hush() {
  turn++;
  player?.remove();
  player = null;
}

// Resolves when the sound really starts; rejects when it cannot, and then the Moon speaks silently.
export async function play(utterance: Utterance, mood: Mood, volume: number): Promise<void> {
  hush();
  const now = turn;
  await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  const wav = speak(await loadBank(), utterance, mood, volume);
  if (now !== turn) throw new Error('interrupted');
  const file = new File(Paths.cache, `moon-${count++ % 2}.wav`); // two names, so a playing file is never overwritten
  file.create({ overwrite: true });
  file.write(wav);
  const mine = createAudioPlayer(file.uri, { updateInterval: 50 });
  player = mine;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('no sound'));
    }, 2000);
    const sub = mine.addListener('playbackStatusUpdate', (status) => {
      if (!status.playing || status.currentTime <= 0) return;
      clearTimeout(timer);
      sub.remove();
      resolve();
    });
    mine.play();
  });
}
