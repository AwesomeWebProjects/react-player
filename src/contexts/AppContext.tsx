import { useState, createContext, ReactNode, useContext, useMemo } from 'react'
import type { IAppContextData, IAppContextApi } from './AppContextTypes'

export const AppContextData = createContext({} as IAppContextData)
export const AppContextApi = createContext({} as IAppContextApi)

export function useAppGlobalStateData(): IAppContextData {
  const context = useContext(AppContextData)

  if (!context) {
    throw new Error('useAppGlobalStateData must be used within a AppGlobalStateProvider')
  }

  return context
}
export function useAppGlobalStateApi(): IAppContextApi {
  const context = useContext(AppContextApi)

  if (!context) {
    throw new Error('useAppGlobalStateApi must be used within a AppGlobalStateProvider')
  }

  return context
}

export const AppGlobalStateProvider = ({ children }: { children: ReactNode }) => {
  /**
   * Audio Context
   */
  // change name to `threadMode`
  const [threadInUse, setThreadInUse] = useState('main') // 'main' or 'worker'
  const [audioContext, setAudioContext] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [gainNode, setGainNode] = useState(null)
  const [currentSource, setCurrentSource] = useState(null)
  const [currentBuffer, setCurrentBuffer] = useState(null)
  const [bufferLength, setBufferLength] = useState(null)
  const [duration, setDuration] = useState(0)
  const [tracks, setTracks] = useState([])
  const [musicIndex, setMusicIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [javascriptNode, setJavascriptNode] = useState(null)
  const [firstPlay, setFirstPlay] = useState(true)
  const [audioContextCreatedTime, setAudioContextCreatedTime] = useState(0)
  const [audioLoadOffsetTime, setAudioLoadOffsetTime] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [updatedVolume, setUpdatedVolume] = useState(false)
  const [isLoadingSong, setIsLoadingSong] = useState(false)
  const [isLoadingFullSong, setIsLoadingFullSong] = useState(false)
  const [canLoadFullSong, setCanLoadFullSong] = useState(true)
  const [playingFullMusic, setPlayingFullMusic] = useState(false)
  const [audioStreamData, setAudioStreamData] = useState(null)
  // @NOTE: tracker disabled - need to re-read stream data and not re-set the position of tracker
  const [trackerEnabled, setTrackerEnabled] = useState(false)

  // @NOTE: need to check if this should be in a state to prevent hydration error on SSR
  const hasStreamSupport =
    typeof window !== 'undefined' && !!window.fetch && !!window.ReadableStream

  /**
   * Canvas Context
   */
  const [canvas, setCanvas] = useState(null)
  const [canvasContext, setCanvasContext] = useState(null)
  const [canvasWidth, setCanvasWidth] = useState(null)
  const [canvasHeight, setCanvasHeight] = useState(null)
  const [canvasScaleCoef, setCanvasScaleCoef] = useState(null)
  const [canvasCx, setCanvasCx] = useState(null)
  const [canvasCy, setCanvasCy] = useState(null)
  const [canvasCoord, setCanvasCoord] = useState(null)
  const [canvasFirstDraw, setCanvasFirstDraw] = useState(true)
  const [canvasResized, setCanvasResized] = useState(false)

  /**
   * Framer Context
   */
  const [framerTransformScale, setFramerTransformScale] = useState(false)
  const [framerCountTicks, setFramerCountTicks] = useState(360)
  const [framerFrequencyData, setFramerFrequencyData] = useState([])
  const [framerTickSize, setFramerTickSize] = useState(10)
  const [framerPI, setFramerPI] = useState(360)
  const [framerIndex, setFramerIndex] = useState(0)
  const [framerLoadingAngle, setFramerLoadingAngle] = useState(0)
  const [framerMaxTickSize, setFramerMaxTickSize] = useState(null)
  const [framerTicks, setFramerTicks] = useState(null)

  /**
   * Scene Context
   */
  const [scenePadding, setScenePadding] = useState(120)
  const [sceneMinSize, setSceneMinSize] = useState(740)
  const [sceneOptimiseHeight, setSceneOptimiseHeight] = useState(982)
  const [sceneInProcess, setSceneInProcess] = useState(false)
  const [sceneRadius, setSceneRadius] = useState(250)

  /**
   * Tracker Context
   */
  const [trackerInnerDelta, setTrackerInnerDelta] = useState(20)
  const [trackerLineWidth, setTrackerLineWidth] = useState(7)
  const [trackerPrevAngle, setTrackerPrevAngle] = useState(0.5)
  const [trackerAngle, setTrackerAngle] = useState(0)
  const [trackerAnimationCount, setTrackerAnimationCount] = useState(10)
  const [trackerPressButton, setTrackerPressButton] = useState(false)
  const [trackerAnimatedInProgress, setTrackerAnimatedInProgress] = useState(false)
  const [trackerAnimateId, setTrackerAnimateId] = useState(null)
  const [trackerR, setTrackerR] = useState(226.5)

  /**
   * Controls Context
   */
  const [timeControl, setTimeControl] = useState({
    textContent: '00:00',
  })

  const memoizedDataValue = useMemo(
    () => ({
      // context
      threadInUse,
      audioContext,
      analyser,
      gainNode,
      currentSource,
      currentBuffer,
      bufferLength,
      duration,
      tracks,
      musicIndex,
      playing,
      javascriptNode,
      firstPlay,
      audioContextCreatedTime,
      audioLoadOffsetTime,
      audioCurrentTime,
      updatedVolume,
      isLoadingSong,
      isLoadingFullSong,
      canLoadFullSong,
      playingFullMusic,
      audioStreamData,
      trackerEnabled,
      // canvas
      canvas,
      canvasContext,
      canvasWidth,
      canvasHeight,
      canvasScaleCoef,
      canvasCx,
      canvasCy,
      canvasCoord,
      canvasFirstDraw,
      canvasResized,
      // framer
      framerTransformScale,
      framerCountTicks,
      framerFrequencyData,
      framerTickSize,
      framerPI,
      framerIndex,
      framerLoadingAngle,
      framerMaxTickSize,
      framerTicks,
      // scene
      scenePadding,
      sceneMinSize,
      sceneOptimiseHeight,
      sceneInProcess,
      sceneRadius,
      // tracker
      trackerInnerDelta,
      trackerLineWidth,
      trackerPrevAngle,
      trackerAngle,
      trackerAnimationCount,
      trackerPressButton,
      trackerAnimatedInProgress,
      trackerAnimateId,
      trackerR,
      // controls
      timeControl,
      hasStreamSupport,
    }),
    [
      // context
      threadInUse,
      audioContext,
      analyser,
      gainNode,
      currentSource,
      currentBuffer,
      bufferLength,
      duration,
      tracks,
      musicIndex,
      playing,
      javascriptNode,
      firstPlay,
      audioContextCreatedTime,
      audioLoadOffsetTime,
      audioCurrentTime,
      updatedVolume,
      isLoadingSong,
      isLoadingFullSong,
      canLoadFullSong,
      playingFullMusic,
      audioStreamData,
      trackerEnabled,
      // canvas
      canvas,
      canvasContext,
      canvasWidth,
      canvasHeight,
      canvasScaleCoef,
      canvasCx,
      canvasCy,
      canvasCoord,
      canvasFirstDraw,
      canvasResized,
      // framer
      framerTransformScale,
      framerCountTicks,
      framerFrequencyData,
      framerTickSize,
      framerPI,
      framerIndex,
      framerLoadingAngle,
      framerMaxTickSize,
      framerTicks,
      // scene
      scenePadding,
      sceneMinSize,
      sceneOptimiseHeight,
      sceneInProcess,
      sceneRadius,
      // tracker
      trackerInnerDelta,
      trackerLineWidth,
      trackerPrevAngle,
      trackerAngle,
      trackerAnimationCount,
      trackerPressButton,
      trackerAnimatedInProgress,
      trackerAnimateId,
      trackerR,
      // controls
      timeControl,
    ],
  )

  const memoizedApiValue = useMemo(
    () => ({
      // set context
      setThreadInUse,
      setAudioContext,
      setAnalyser,
      setGainNode,
      setCurrentBuffer,
      setCurrentSource,
      setBufferLength,
      setDuration,
      setTracks,
      setMusicIndex,
      setPlaying,
      setJavascriptNode,
      setFirstPlay,
      setAudioContextCreatedTime,
      setAudioLoadOffsetTime,
      setAudioCurrentTime,
      setUpdatedVolume,
      setIsLoadingSong,
      setIsLoadingFullSong,
      setCanLoadFullSong,
      setPlayingFullMusic,
      setAudioStreamData,
      setTrackerEnabled,
      // set canvas
      setCanvas,
      setCanvasContext,
      setCanvasWidth,
      setCanvasHeight,
      setCanvasScaleCoef,
      setCanvasCx,
      setCanvasCy,
      setCanvasCoord,
      setCanvasFirstDraw,
      setCanvasResized,
      // set framer
      setFramerTransformScale,
      setFramerCountTicks,
      setFramerFrequencyData,
      setFramerTickSize,
      setFramerPI,
      setFramerIndex,
      setFramerLoadingAngle,
      setFramerMaxTickSize,
      setFramerTicks,
      // scene
      setScenePadding,
      setSceneMinSize,
      setSceneOptimiseHeight,
      setSceneInProcess,
      setSceneRadius,
      // tracker
      setTrackerInnerDelta,
      setTrackerLineWidth,
      setTrackerPrevAngle,
      setTrackerAngle,
      setTrackerAnimationCount,
      setTrackerPressButton,
      setTrackerAnimatedInProgress,
      setTrackerAnimateId,
      setTrackerR,
      // controls
      setTimeControl,
    }),
    [
      // set context
      setThreadInUse,
      setAudioContext,
      setAnalyser,
      setGainNode,
      setCurrentBuffer,
      setCurrentSource,
      setBufferLength,
      setDuration,
      setTracks,
      setMusicIndex,
      setPlaying,
      setJavascriptNode,
      setFirstPlay,
      setAudioContextCreatedTime,
      setAudioLoadOffsetTime,
      setAudioCurrentTime,
      setUpdatedVolume,
      setIsLoadingSong,
      setIsLoadingFullSong,
      setCanLoadFullSong,
      setPlayingFullMusic,
      setAudioStreamData,
      setTrackerEnabled,
      // set canvas
      setCanvas,
      setCanvasContext,
      setCanvasWidth,
      setCanvasHeight,
      setCanvasScaleCoef,
      setCanvasCx,
      setCanvasCy,
      setCanvasCoord,
      setCanvasFirstDraw,
      setCanvasResized,
      // set framer
      setFramerTransformScale,
      setFramerCountTicks,
      setFramerFrequencyData,
      setFramerTickSize,
      setFramerPI,
      setFramerIndex,
      setFramerLoadingAngle,
      setFramerMaxTickSize,
      setFramerTicks,
      // scene
      setScenePadding,
      setSceneMinSize,
      setSceneOptimiseHeight,
      setSceneInProcess,
      setSceneRadius,
      // tracker
      setTrackerInnerDelta,
      setTrackerLineWidth,
      setTrackerPrevAngle,
      setTrackerAngle,
      setTrackerAnimationCount,
      setTrackerPressButton,
      setTrackerAnimatedInProgress,
      setTrackerAnimateId,
      setTrackerR,
      // controls
      setTimeControl,
    ],
  )

  // @ts-ignore
  return (
    <AppContextData.Provider value={memoizedDataValue}>
      <AppContextApi.Provider value={memoizedApiValue}>{children}</AppContextApi.Provider>
    </AppContextData.Provider>
  )
}
