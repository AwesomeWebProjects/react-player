export interface IAppContextData {
  // context
  threadInUse
  audioContext
  analyser
  gainNode
  currentBuffer
  currentSource
  bufferLength
  duration
  tracks
  musicIndex
  playing
  javascriptNode
  firstPlay
  audioContextCreatedTime
  audioLoadOffsetTime
  audioCurrentTime
  updatedVolume
  isLoadingSong
  isLoadingFullSong
  canLoadFullSong
  playingFullMusic
  audioStreamData
  trackerEnabled
  // canvas
  canvas
  canvasContext
  canvasWidth
  canvasHeight
  canvasScaleCoef
  canvasCx
  canvasCy
  canvasCoord
  canvasFirstDraw
  canvasResized
  // framer
  framerTransformScale
  framerCountTicks
  framerFrequencyData
  framerTickSize
  framerPI
  framerIndex
  framerLoadingAngle
  framerMaxTickSize
  framerTicks
  // scene
  scenePadding
  sceneMinSize
  sceneOptimiseHeight
  sceneInProcess
  sceneRadius
  // tracker
  trackerInnerDelta
  trackerLineWidth
  trackerPrevAngle
  trackerAngle
  trackerAnimationCount
  trackerPressButton
  trackerAnimatedInProgress
  trackerAnimateId
  trackerR
  // controls
  timeControl
  // others
  hasStreamSupport
}
export interface IAppContextApi {
  // set context
  setThreadInUse
  setAudioContext
  setAnalyser
  setGainNode
  setCurrentBuffer
  setCurrentSource
  setBufferLength
  setDuration
  setTracks
  setMusicIndex
  setPlaying
  setJavascriptNode
  setFirstPlay
  setAudioContextCreatedTime
  setAudioLoadOffsetTime
  setAudioCurrentTime
  setUpdatedVolume
  setIsLoadingSong
  setIsLoadingFullSong
  setCanLoadFullSong
  setPlayingFullMusic
  setAudioStreamData
  setTrackerEnabled
  // set canvas
  setCanvas
  setCanvasContext
  setCanvasWidth
  setCanvasHeight
  setCanvasScaleCoef
  setCanvasCx
  setCanvasCy
  setCanvasCoord
  setCanvasFirstDraw
  setCanvasResized
  // set framer
  setFramerTransformScale
  setFramerCountTicks
  setFramerFrequencyData
  setFramerTickSize
  setFramerPI
  setFramerIndex
  setFramerLoadingAngle
  setFramerMaxTickSize
  setFramerTicks
  // scene
  setScenePadding
  setSceneMinSize
  setSceneOptimiseHeight
  setSceneInProcess
  setSceneRadius
  // tracker
  setTrackerInnerDelta
  setTrackerLineWidth
  setTrackerPrevAngle
  setTrackerAngle
  setTrackerAnimationCount
  setTrackerPressButton
  setTrackerAnimatedInProgress
  setTrackerAnimateId
  setTrackerR
  // controls
  setTimeControl
}

export type ExtraActionWhenCloseModalType = () => void
