"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  AUDIO_TIME_DECIMALS,
  DEFAULT_PLAYBACK_RATE,
  DEFAULT_VOLUME,
  MAX_PLAYBACK_RATE,
  MAX_VOLUME,
  MILLISECONDS_PER_SECOND,
  MIN_PLAYBACK_RATE,
  MIN_VOLUME,
} from "@/lib/constants";

interface AudioEngineState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isLoaded: boolean;
  error: string | null;
}

interface AudioEngineControls {
  rawHowl: MutableRefObject<Howl | null>;
  load: (url: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;
}

export type AudioEngine = AudioEngineState & AudioEngineControls;

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);

const roundTime = (seconds: number): number => Number(seconds.toFixed(AUDIO_TIME_DECIMALS));

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function useAudioEngine(): AudioEngine {
  const howlRef = useRef<Howl | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(DEFAULT_PLAYBACK_RATE);
  const playbackBasePositionRef = useRef<number>(0);
  const playbackBaseTimeRef = useRef<number>(0);

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    isLoaded: false,
    error: null,
  });

  const stopAnimation = useCallback((): void => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  const syncPlaybackClock = useCallback((position: number): void => {
    playbackBasePositionRef.current = position;
    playbackBaseTimeRef.current = performance.now();
  }, []);

  const getClockPosition = useCallback((): number => {
    if (!isPlayingRef.current) {
      return playbackBasePositionRef.current;
    }

    const elapsedSeconds = (performance.now() - playbackBaseTimeRef.current) / MILLISECONDS_PER_SECOND;
    return clamp(playbackBasePositionRef.current + elapsedSeconds * playbackRateRef.current, 0, durationRef.current);
  }, []);

  const updateCurrentTime = useCallback((): void => {
    const nextTime = roundTime(getClockPosition());

    setState((currentState) => ({
      ...currentState,
      currentTime: nextTime,
    }));

    animationFrameIdRef.current = requestAnimationFrame(updateCurrentTime);
  }, [getClockPosition]);

  const startAnimation = useCallback((): void => {
    stopAnimation();
    animationFrameIdRef.current = requestAnimationFrame(updateCurrentTime);
  }, [stopAnimation, updateCurrentTime]);

  const readHowlPosition = useCallback((): number => {
    const howl = howlRef.current;
    const seekPosition = howl?.seek();

    return typeof seekPosition === "number" ? seekPosition : playbackBasePositionRef.current;
  }, []);

  const load = useCallback(
    (url: string): Promise<void> =>
      new Promise((resolve) => {
        stopAnimation();
        howlRef.current?.unload();
        durationRef.current = 0;
        isPlayingRef.current = false;
        playbackRateRef.current = DEFAULT_PLAYBACK_RATE;
        syncPlaybackClock(0);

        setState({
          isPlaying: false,
          duration: 0,
          currentTime: 0,
          isLoaded: false,
          error: null,
        });

        const howl = new Howl({
          src: [url],
          html5: false,
          volume: DEFAULT_VOLUME,
          rate: DEFAULT_PLAYBACK_RATE,
          onload: () => {
            const duration = roundTime(howl.duration());
            durationRef.current = duration;

            setState((currentState) => ({
              ...currentState,
              duration,
              isLoaded: true,
              error: null,
            }));
            resolve();
          },
          onloaderror: (_soundId: number, loadError: unknown) => {
            const error = getErrorMessage(loadError);
            isPlayingRef.current = false;
            setState((currentState) => ({
              ...currentState,
              isLoaded: false,
              isPlaying: false,
              error,
            }));
            resolve();
          },
          onplay: () => {
            const position = readHowlPosition();
            isPlayingRef.current = true;
            syncPlaybackClock(position);
            setState((currentState) => ({
              ...currentState,
              isPlaying: true,
              currentTime: roundTime(position),
            }));
            startAnimation();
          },
          onpause: () => {
            const position = readHowlPosition();
            isPlayingRef.current = false;
            stopAnimation();
            syncPlaybackClock(position);
            setState((currentState) => ({
              ...currentState,
              isPlaying: false,
              currentTime: roundTime(position),
            }));
          },
          onend: () => {
            isPlayingRef.current = false;
            stopAnimation();
            syncPlaybackClock(durationRef.current);
            setState((currentState) => ({
              ...currentState,
              isPlaying: false,
              currentTime: roundTime(durationRef.current),
            }));
          },
        });

        howlRef.current = howl;
      }),
    [readHowlPosition, startAnimation, stopAnimation, syncPlaybackClock],
  );

  const play = useCallback((): void => {
    const howl = howlRef.current;

    if (!howl || !state.isLoaded || state.isPlaying) {
      return;
    }

    howl.play();
  }, [state.isLoaded, state.isPlaying]);

  const pause = useCallback((): void => {
    howlRef.current?.pause();
  }, []);

  const seek = useCallback(
    (seconds: number): void => {
      const howl = howlRef.current;

      if (!howl || !state.isLoaded) {
        return;
      }

      const nextPosition = clamp(seconds, 0, durationRef.current);
      howl.seek(nextPosition);
      syncPlaybackClock(nextPosition);

      setState((currentState) => ({
        ...currentState,
        currentTime: roundTime(nextPosition),
      }));
    },
    [state.isLoaded, syncPlaybackClock],
  );

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
    howlRef.current?.volume(clampedVolume);
  }, []);

  const setRate = useCallback(
    (rate: number): void => {
      const clampedRate = clamp(rate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
      const currentPosition = getClockPosition();

      playbackRateRef.current = clampedRate;
      howlRef.current?.rate(clampedRate);
      syncPlaybackClock(currentPosition);
    },
    [getClockPosition, syncPlaybackClock],
  );

  useEffect(() => {
    return () => {
      stopAnimation();
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [stopAnimation]);

  return {
    ...state,
    rawHowl: howlRef,
    load,
    play,
    pause,
    seek,
    setVolume,
    setRate,
  };
}
