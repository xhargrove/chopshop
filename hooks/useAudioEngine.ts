"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type WaveSurfer from "wavesurfer.js";

import {
  AUDIO_TIME_DECIMALS,
  DEFAULT_VOLUME,
  MAX_PLAYBACK_RATE,
  MAX_VOLUME,
  MIN_PLAYBACK_RATE,
  MIN_VOLUME,
  PLAYHEAD_UI_UPDATE_MS,
} from "@/lib/constants";

interface AudioEngineState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isLoaded: boolean;
  error: string | null;
}

interface AudioEngineControls {
  rawWaveSurfer: MutableRefObject<WaveSurfer | null>;
  bind: (wavesurfer: WaveSurfer) => () => void;
  registerPlayheadSync: (handler: ((seconds: number) => void) | null) => void;
  load: () => Promise<void>;
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
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const durationRef = useRef<number>(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isApplyingSeekRef = useRef(false);
  const isPlayingRef = useRef(false);
  const playheadSyncRef = useRef<((seconds: number) => void) | null>(null);

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    isLoaded: false,
    error: null,
  });

  const syncPlayheadStore = useCallback((seconds: number): void => {
    playheadSyncRef.current?.(roundTime(seconds));
  }, []);

  const bind = useCallback((wavesurfer: WaveSurfer): (() => void) => {
    unsubscribeRef.current?.();
    waveSurferRef.current = wavesurfer;
    let lastUiUpdateAt = 0;

    const publishTime = (seconds: number, force: boolean = false): void => {
      const nextTime = roundTime(seconds);
      const now = performance.now();

      if (!force && now - lastUiUpdateAt < PLAYHEAD_UI_UPDATE_MS) {
        return;
      }

      lastUiUpdateAt = now;
      setState((currentState) => (currentState.currentTime === nextTime ? currentState : { ...currentState, currentTime: nextTime }));
    };

    const handleUserSeek = (seconds: number): void => {
      publishTime(seconds, true);

      if (!isApplyingSeekRef.current) {
        syncPlayheadStore(seconds);
      }
    };

    const offReady = wavesurfer.on("ready", () => {
      const duration = roundTime(wavesurfer.getDuration());
      durationRef.current = duration;
      wavesurfer.setVolume(DEFAULT_VOLUME);

      setState({
        isPlaying: false,
        duration,
        currentTime: roundTime(wavesurfer.getCurrentTime()),
        isLoaded: true,
        error: null,
      });
    });

    const offPlay = wavesurfer.on("play", () => {
      isPlayingRef.current = true;
      setState((currentState) => (currentState.isPlaying ? currentState : { ...currentState, isPlaying: true }));
    });

    const offPause = wavesurfer.on("pause", () => {
      isPlayingRef.current = false;
      handleUserSeek(wavesurfer.getCurrentTime());
      setState((currentState) => ({ ...currentState, isPlaying: false }));
    });

    const offFinish = wavesurfer.on("finish", () => {
      isPlayingRef.current = false;
      setState((currentState) => ({
        ...currentState,
        isPlaying: false,
        currentTime: roundTime(durationRef.current),
      }));
      syncPlayheadStore(durationRef.current);
    });

    const offTime = wavesurfer.on("timeupdate", (time) => {
      publishTime(time);

      if (!isPlayingRef.current) {
        syncPlayheadStore(time);
      }
    });

    const offSeek = wavesurfer.on("seeking", (time) => {
      handleUserSeek(time);
    });

    const offInteraction = wavesurfer.on("interaction", () => {
      handleUserSeek(wavesurfer.getCurrentTime());
    });

    const offError = wavesurfer.on("error", (waveformError) => {
      isPlayingRef.current = false;
      setState((currentState) => ({
        ...currentState,
        isLoaded: false,
        isPlaying: false,
        error: getErrorMessage(waveformError),
      }));
    });

    unsubscribeRef.current = (): void => {
      offReady();
      offPlay();
      offPause();
      offFinish();
      offTime();
      offSeek();
      offInteraction();
      offError();

      if (waveSurferRef.current === wavesurfer) {
        waveSurferRef.current = null;
      }
    };

    return unsubscribeRef.current;
  }, [syncPlayheadStore]);

  const registerPlayheadSync = useCallback((handler: ((seconds: number) => void) | null): void => {
    playheadSyncRef.current = handler;
  }, []);

  const load = useCallback(async (): Promise<void> => {
    durationRef.current = 0;
    isPlayingRef.current = false;
    setState({
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      isLoaded: false,
      error: null,
    });
  }, []);

  const play = useCallback((): void => {
    const wavesurfer = waveSurferRef.current;

    if (!wavesurfer || !state.isLoaded || state.isPlaying) {
      return;
    }

    void wavesurfer.play();
  }, [state.isLoaded, state.isPlaying]);

  const pause = useCallback((): void => {
    void waveSurferRef.current?.pause();
  }, []);

  const seek = useCallback(
    (seconds: number): void => {
      const wavesurfer = waveSurferRef.current;

      if (!wavesurfer || !state.isLoaded || isApplyingSeekRef.current) {
        return;
      }

      const nextPosition = clamp(seconds, 0, durationRef.current || wavesurfer.getDuration());
      const roundedPosition = roundTime(nextPosition);

      if (roundTime(wavesurfer.getCurrentTime()) === roundedPosition) {
        setState((currentState) =>
          currentState.currentTime === roundedPosition ? currentState : { ...currentState, currentTime: roundedPosition },
        );
        return;
      }

      isApplyingSeekRef.current = true;

      try {
        wavesurfer.setTime(nextPosition);
      } finally {
        queueMicrotask(() => {
          isApplyingSeekRef.current = false;
        });
      }

      setState((currentState) => ({
        ...currentState,
        currentTime: roundedPosition,
      }));
    },
    [state.isLoaded],
  );

  const setVolume = useCallback((volume: number): void => {
    waveSurferRef.current?.setVolume(clamp(volume, MIN_VOLUME, MAX_VOLUME));
  }, []);

  const setRate = useCallback((rate: number): void => {
    const clampedRate = clamp(rate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
    waveSurferRef.current?.setPlaybackRate(clampedRate);
  }, []);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      waveSurferRef.current = null;
      playheadSyncRef.current = null;
    };
  }, []);

  return {
    ...state,
    rawWaveSurfer: waveSurferRef,
    bind,
    registerPlayheadSync,
    load,
    play,
    pause,
    seek,
    setVolume,
    setRate,
  };
}
