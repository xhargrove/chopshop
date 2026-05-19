import {
  AUDIO_TIME_DECIMALS,
  DEFAULT_BARS_PER_PHRASE,
  DEFAULT_BEATS_PER_BAR,
  MAX_BEAT_GRID_POINTS,
  SECONDS_PER_MINUTE,
} from "@/lib/constants";

const roundSeconds = (seconds: number): number => Number(seconds.toFixed(AUDIO_TIME_DECIMALS));

const getBeatDuration = (bpm: number): number => SECONDS_PER_MINUTE / bpm;

const getFirstBeatIndexInRange = (startSeconds: number, bpm: number, offset: number): number =>
  Math.ceil((startSeconds - offset) / getBeatDuration(bpm));

const getLastBeatIndexInRange = (endSeconds: number, bpm: number, offset: number): number =>
  Math.floor((endSeconds - offset) / getBeatDuration(bpm));

export function getBeatPosition(beatIndex: number, bpm: number, offset: number): number {
  return roundSeconds(offset + beatIndex * getBeatDuration(bpm));
}

export function getNearestBeatIndex(timeSeconds: number, bpm: number, offset: number): number {
  return Math.round((timeSeconds - offset) / getBeatDuration(bpm));
}

export function getBeatsInRange(startSeconds: number, endSeconds: number, bpm: number, offset: number): number[] {
  const firstBeatIndex = getFirstBeatIndexInRange(startSeconds, bpm, offset);
  const lastBeatIndex = getLastBeatIndexInRange(endSeconds, bpm, offset);
  const beatCount = Math.min(Math.max(lastBeatIndex - firstBeatIndex + 1, 0), MAX_BEAT_GRID_POINTS);

  return Array.from({ length: beatCount }, (_value, index) => getBeatPosition(firstBeatIndex + index, bpm, offset));
}

export function getBarsInRange(
  startSeconds: number,
  endSeconds: number,
  bpm: number,
  offset: number,
  beatsPerBar: number = DEFAULT_BEATS_PER_BAR,
): number[] {
  return getBeatsInRange(startSeconds, endSeconds, bpm, offset).filter((beatPosition) => getNearestBeatIndex(beatPosition, bpm, offset) % beatsPerBar === 0);
}

export function getPhrasesInRange(
  startSeconds: number,
  endSeconds: number,
  bpm: number,
  offset: number,
  barsPerPhrase: number = DEFAULT_BARS_PER_PHRASE,
): number[] {
  const beatsPerPhrase = barsPerPhrase * DEFAULT_BEATS_PER_BAR;
  return getBeatsInRange(startSeconds, endSeconds, bpm, offset).filter(
    (beatPosition) => getNearestBeatIndex(beatPosition, bpm, offset) % beatsPerPhrase === 0,
  );
}
