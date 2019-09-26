import React, { Component } from 'react'
import audioWorkerJS from './audio.worker.js'
import { appContext } from 'context/app-context'

import {
  PlayArrow,
  Pause,
  FastForward,
  FastRewind,
  VolumeMute,
  VolumeDown,
  VolumeUp
} from '@material-ui/icons'

class Audio extends Component {
  constructor(props) {
    super(props)

    /**
     * worker
     */
    this.audioWorker = audioWorkerJS()
    this.audioWorker.onmessage = (data) => this.handleWorkerCallback(data)

    /**
     * state
     */
    this.state = {
      /**
       * Audio Context
       */
      threadInUse: this.props.thread || 'worker', // 'main' or 'worker'
      audioContext: null,
      analyser: null,
      gainNode: null,
      currentSource: null,
      bufferLength: null,
      duration: 0,
      tracks: this.props.tracks || [],
      musicIndex: 0,
      playing: false,
      javascriptNode: null,
      firstPlay: true,
      audioContextCreatedTime: 0,
      audioLoadOffsetTime: 0,
      audioCurrentTime: 0,
      updatedVolume: false,
      isLoadingSong: false,
      isLoadingFullSong: false,
      canLoadFullSong: true,
      playingFullMusic: false,
      audioStreamData: null,
      trackerEnabled: false, // @NOTE: tracker disabled until solve the thing of re-read stream data and not re-set the position of tracker

      /**
       * Canvas Context
       */
      canvas: null,
      canvasContext: null,
      canvasWidth: null,
      canvasHeight: null,
      canvasScaleCoef: null,
      canvasCx: null,
      canvasCy: null,
      canvasCoord: null,
      canvasFirstDraw: true,
      canvasResized: false,

      /**
       * Framer Context
       */
      framerTransformScale: false,
      framerCountTicks: 360,
      framerFrequencyData: [],
      framerTickSize: 10,
      framerPI: 360,
      framerIndex: 0,
      framerLoadingAngle: 0,
      framerMaxTickSize: null,
      framerTicks: null,

      /**
       * Scene Context
       */
      scenePadding: 120,
      sceneMinSize: 740,
      sceneOptimiseHeight: 982,
      sceneInProcess: false,
      sceneRadius: 250,

      /**
       * Tracker Context
       */
      trackerInnerDelta: 20,
      trackerLineWidth: 7,
      trackerPrevAngle: 0.5,
      trackerAngle: 0,
      trackerAnimationCount: 10,
      trackerPressButton: false,
      trackerAnimatedInProgress: false,
      trackerAnimateId: null,
      trackerR: 226.5,

      /**
       * Controls Context
       */
      timeControl: {
        textContent: '00:00'
      },

      /**
       * Misc
       */
      initialFixedTicks: false,
      hasStreamSupport: !!window.fetch && !!window.ReadableStream
    }

    /**
     * functions
     */
    // @Player
    this.init = this.init.bind(this)
    this.loadSong = this.loadSong.bind(this)
    this.playSound = this.playSound.bind(this)
    this.startPlayer = this.startPlayer.bind(this)
    this.suspendSong = this.suspendSong.bind(this)
    this.resumeSong = this.resumeSong.bind(this)
    this.prevSong = this.prevSong.bind(this)
    this.nextSong = this.nextSong.bind(this)
    this.switchSong = this.switchSong.bind(this)
    this.showPlayer = this.showPlayer.bind(this)
    this.audioXMLHttpRequest = this.audioXMLHttpRequest.bind(this)
    this.audioStream = this.audioStream.bind(this)
    this.readAudioStream = this.readAudioStream.bind(this)
    // @Framer
    this.framerInit = this.framerInit.bind(this)
    this.framerDraw = this.framerDraw.bind(this)
    this.framerDrawTick = this.framerDrawTick.bind(this)
    this.framerDrawTicks = this.framerDrawTicks.bind(this)
    this.framerDrawEdging = this.framerDrawEdging.bind(this)
    this.framerGetTicks = this.framerGetTicks.bind(this)
    this.framerGetTickPoints = this.framerGetTickPoints.bind(this)
    this.framerSetLoadingPercent = this.framerSetLoadingPercent.bind(this)
    this.framerGetSize = this.framerGetSize.bind(this)
    // @Scene
    this.sceneInit = this.sceneInit.bind(this)
    this.startSceneRender = this.startSceneRender.bind(this)
    this.sceneRender = this.sceneRender.bind(this)
    this.sceneClear = this.sceneClear.bind(this)
    this.sceneDraw = this.sceneDraw.bind(this)
    // @Tracker
    this.trackerInit = this.trackerInit.bind(this)
    this.trackerStartAnimation = this.trackerStartAnimation.bind(this)
    this.trackerStopAnimation = this.trackerStopAnimation.bind(this)
    this.trackerIsInsideOfSmallCircle = this.trackerIsInsideOfSmallCircle.bind(this)
    this.trackerIsOusideOfBigCircle = this.trackerIsOusideOfBigCircle.bind(this)
    // @Controls
    this.controlsDraw = this.controlsDraw.bind(this)
    this.controlsGetQuadrant = this.controlsGetQuadrant.bind(this)
    // @Miscs
    this.changeVolume = this.changeVolume.bind(this)
    this.getVolume = this.getVolume.bind(this)
    this.timeHandler = this.timeHandler.bind(this)
    this.preLoadCompleteSong = this.preLoadCompleteSong.bind(this)
    this.initEvents = this.initEvents.bind(this)
    this.getSongName = this.getSongName.bind(this)
    this.getSongArtist = this.getSongArtist.bind(this)
    this.songContextHandler = this.songContextHandler.bind(this)
    this.handleWorkerCallback = this.handleWorkerCallback.bind(this)
  }

  componentDidMount() {
    new Promise(resolve => this.canvasConfigure(resolve))
    .then(() => this.showPlayer())
  }

  componentWillUnmount() {
    this.audioWorker.terminate()
  }

  showPlayer() {
    this.framerSetLoadingPercent(1)
    this.sceneInit()
  }

  startPlayer() {
    this.init()
  }

  initEvents() {
    document.addEventListener('keydown', (event) => {
      const { audioContext } = this.state
      const key = event.which

      switch (key) {
        // https://css-tricks.com/snippets/javascript/javascript-keycodes/
        case 32:
          /**
           * key pressed: Spacebar
           * pause or play song
           */
          if (audioContext.state === 'suspended') {
            audioContext.resume()
            this.setState({ playing: true })
          } else {
            audioContext.suspend()
            this.setState({ playing: false })
          }
          break

        case 78:
          /**
           * key pressed: N
           * go to the next song
           */
          this.nextSong()
          break

        case 66:
          /**
           * key pressed: B
           * back to the prev song
           */
          this.prevSong()
          break

        default:
          break
      }
    })
  }

  handleWorkerCallback(workerResponse) {
    const {
      audioContext,
      analyser,
      gainNode,
      javascriptNode,
      canLoadFullSong
    } = this.state

    let {
      audioContextCreatedTime,
      audioLoadOffsetTime
    } = this.state

    const {
      response: responseBuffer,
      actionType,
      playingFullMusic
    } = workerResponse.data

    /**
     * Update state 'playingFullMusic' with the value from worker
     */
    this.setState({ playingFullMusic })

    console.log('call back data: ', workerResponse.data)

    switch (actionType) {
      case 'load':
        this.setState({ workerBuffer: responseBuffer }, () => {
          console.log('start decode audio')
          audioContext.decodeAudioData(responseBuffer, (buffer) => {
            if (this.state.currentSource !== null) {
              this.state.currentSource.disconnect()
            }

            const currentSource = audioContext.createBufferSource()

            currentSource.buffer = buffer
            this.setState({ currentSource }, () => {
              console.log('audio decoded and starting music')
              this.playSound()
              audioLoadOffsetTime = (new Date() - audioContextCreatedTime) / 1000

              if (audioLoadOffsetTime > audioContext.currentTime) {
                audioLoadOffsetTime = audioContext.currentTime
              }

              this.setState({
                audioContextCreatedTime,
                audioLoadOffsetTime,
                isLoadingSong: false,
                canLoadFullSong: true
              })
            })
          }, function (error) {
            console.error(error)
          })
        })
        break

      case 'preload':
        audioContext.decodeAudioData(responseBuffer, (buffer) => {
          if (canLoadFullSong) {
            this.state.currentSource.disconnect()

            const currentSource = audioContext.createBufferSource()
            currentSource.buffer = buffer

            const offset = (audioContext.currentTime - audioLoadOffsetTime)

            const source = currentSource
            source.connect(analyser)
            analyser.connect(gainNode)
            gainNode.connect(audioContext.destination)
            javascriptNode.connect(audioContext.destination)

            source.start(offset, offset)

            if (audioContext.state === 'suspended') {
              audioContext.resume()
            }

            this.setState({ playing: true, isLoadingFullSong: false, canLoadFullSong: false })

            this.setState({ currentSource }, () => {
              console.log('audio decoded and starting music from stream - full song loaded')
              const offset = (audioContext.currentTime - audioLoadOffsetTime)
              console.log({
                offset,
                duration: currentSource.buffer.duration
              })

              this.setState({ audioContextCreatedTime })
            })
          }
        }, function (error) {
          console.error(error)
        })
        break

      default:
        break
    }

  }

  init() {
    try {
      const { tracks, musicIndex } = this.state

      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const audioContextCreatedTime = new Date()
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      analyser.fftSize = 2048
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      javascriptNode.onaudioprocess = () => {
        analyser.getByteFrequencyData(this.state.framerFrequencyData) // For Bits
        // analyser.getByteTimeDomainData(this.state.framerFrequencyData) // For Waves
      }

      this.initEvents()

      this.setState({
        audioContext,
        analyser,
        gainNode,
        dataArray,
        bufferLength,
        framerFrequencyData: dataArray,
        javascriptNode,
        audioContextCreatedTime
      }, () => {
          this.loadSong(tracks[musicIndex].url)
      })
    } catch (error) {
      console.error(error)
      console.error('Web Audio API is not supported in this browser')
    }
  }

  loadSong(url) {
    const {
      hasStreamSupport,
      threadInUse,
      playingFullMusic
    } = this.state

    if (hasStreamSupport) {
      console.log('fetch and stream')
      if (threadInUse === 'worker') {
        this.audioWorker.postMessage({ type: 'audio', data: { url, playingFullMusic }})
      } else if (threadInUse === 'main') {
        this.audioStream(url)
      } else {
        console.error('React Player - No thread specified')
      }
    } else {
      this.audioXMLHttpRequest(url)
    }
  }

  audioXMLHttpRequest(url) {
    const { audioContext } = this.state
    let {
      audioContextCreatedTime,
      audioLoadOffsetTime
    } = this.state

    const request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = 'arraybuffer'

    // Decode asynchronously
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        const completeBuffer = buffer
        const currentSource = audioContext.createBufferSource()

        currentSource.buffer = completeBuffer
        this.setState({ currentSource }, () => {
          this.playSound()
          audioLoadOffsetTime = (new Date() - audioContextCreatedTime) / 1000

          if (audioLoadOffsetTime > audioContext.currentTime) {
            audioLoadOffsetTime = audioContext.currentTime
          }

          this.setState({
            audioContextCreatedTime,
            audioLoadOffsetTime,
            playingFullMusic: true,
            isLoadingSong: false
          })
        })
      }, function (error) {
        console.error(error)
      })
    }
    request.send()
  }

  audioStream(url) {
    const { audioContext } = this.state
    let {
      audioContextCreatedTime,
      audioLoadOffsetTime
    } = this.state

    fetch(url).then(response => {
      if (!response.ok) {
        throw Error(`${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw Error('ReadableStream not yet supported in this browser.')
      }

      const contentLength = response.headers.get('content-length')
      if (!contentLength) {
        throw Error('Content-Length response header unavailable')
      }

      const audioStreamData = { response: response.clone(), contentLength: response.headers.get('content-length') }

      this.setState({ audioStreamData })

      const stream = this.readAudioStream(response, contentLength, { all: false, sec: 3, amount: 1245184 })
      return new Response(stream)
    }).then(response => {
      return response.arrayBuffer()
    }).then(responseBuffer => {
      console.log('start decode audio')
      audioContext.decodeAudioData(responseBuffer, (buffer) => {
        if (this.state.currentSource !== null) {
          this.state.currentSource.disconnect()
        }

        const currentSource = audioContext.createBufferSource()

        currentSource.buffer = buffer
        this.setState({ currentSource }, () => {
          console.log('audio decoded and starting music')
          this.playSound()
          audioLoadOffsetTime = (new Date() - audioContextCreatedTime) / 1000

          if (audioLoadOffsetTime > audioContext.currentTime) {
            audioLoadOffsetTime = audioContext.currentTime
          }

          this.setState({
            audioContextCreatedTime,
            audioLoadOffsetTime,
            isLoadingSong: false,
            canLoadFullSong: true
          })
        })
      }, function (error) {
        console.error(error)
      })
    })
  }

  readAudioStream(response, contentLength, params) {
    const total = parseInt(contentLength, 10)
    let loaded = 0
    const startedStream = new Date()
    const that = this

    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body.getReader()
        const read = () => {
          reader.read().then(({ done, value }) => {

            if (!params.all) {
              if (params.amount) {
                if (params.amount < total && loaded >= params.amount) {
                  console.log(`Close stream frag - amount`)
                  reader.releaseLock()
                  controller.close()
                  return
                } else if (loaded >= (65536 * 5)) { // 327.680
                  console.log(`Close stream frag - amount`)
                  reader.releaseLock()
                  controller.close()
                  return
                }
              } else {
                  if (((new Date() - startedStream) / 1000) >= (params.sec || 5)) {
                    console.log(`Close stream frag - time`)
                    reader.releaseLock()
                    controller.close()
                    return
                  }
              }
            }
            if (done) {
              console.log(`Close stream done`)
              that.setState({ playingFullMusic: true })
              reader.releaseLock()
              controller.close()
              return
            }

            loaded += value.byteLength
            console.log({ loaded, total, percent: `${((loaded * 100) / total).toFixed(2)}%` }, (new Date() - startedStream) / 1000)
            controller.enqueue(value)

            read()
          }).catch(error => {
            console.error(error)
            controller.error(error)
          })
        }

        read()
      }
    })

    return stream
  }

  playSound(when = null, offset = null) {
    const {
      audioContext,
      analyser,
      gainNode,
      javascriptNode,
      currentSource,
      updatedVolume
    } = this.state

    const source = currentSource
    source.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)
    javascriptNode.connect(audioContext.destination)

    // Set the start volume to 50%.
    if (gainNode && !updatedVolume) {
      gainNode.gain.value = 0.5
    }

    if (when && offset) {
      source.start(when, offset)
    } else {
      source.start(0)
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    this.setState({ playing: true })
  }

  preLoadCompleteSong() {
    const {
      audioContext,
      analyser,
      gainNode,
      javascriptNode,
      canLoadFullSong
    } = this.state

    let {
      audioStreamData,
      audioLoadOffsetTime,
      audioContextCreatedTime
    } = this.state

    new Promise((resolve) => {
      this.setState({ audioStreamData: { response: audioStreamData.response.clone(), contentLength: audioStreamData.response.headers.get('content-length') } })

      const stream = this.readAudioStream(audioStreamData.response, audioStreamData.contentLength, { all: true, sec: 1, amount: 1050478 })
      resolve(new Response(stream))
    }).then(response => {
      return response.arrayBuffer()
    }).then(responseBuffer => {
      audioContext.decodeAudioData(responseBuffer, (buffer) => {
        if (canLoadFullSong) {
          this.state.currentSource.disconnect()

          const currentSource = audioContext.createBufferSource()
          currentSource.buffer = buffer

          const offset = (audioContext.currentTime - audioLoadOffsetTime)

          const source = currentSource
          source.connect(analyser)
          analyser.connect(gainNode)
          gainNode.connect(audioContext.destination)
          javascriptNode.connect(audioContext.destination)

          source.start(offset, offset)

          if (audioContext.state === 'suspended') {
            audioContext.resume()
          }

          this.setState({ playing: true, isLoadingFullSong: false })

          this.setState({ currentSource }, () => {
            console.log('audio decoded and starting music from stream - full song loaded')
            const offset = (audioContext.currentTime - audioLoadOffsetTime)
            console.log({
              offset,
              duration: currentSource.buffer.duration
            })

            this.setState({ audioContextCreatedTime})
          })
        }
      }, function (error) {
        console.error(error)
      })
    })
  }

  suspendSong() {
    this.state.audioContext.suspend()
    this.setState({ playing: false })
  }

  resumeSong() {
    const { firstPlay } = this.state
    if (firstPlay) {
      this.setState({ isLoadingSong: true })
      this.init()
      this.setState({ firstPlay: false })
    } else {
      this.state.audioContext.resume()
      this.setState({ playing: true })
    }
  }

  nextSong() {
    const {
      firstPlay,
      audioContext
    } = this.state
    let { musicIndex, tracks } = this.state

    if (musicIndex >= (tracks.length - 1)) {
      musicIndex = 0
    } else {
      musicIndex += 1
    }

    console.log({musicIndex})

    if (firstPlay) {
      this.setState({ isLoadingSong: true })
      this.setState({ firstPlay: false, musicIndex }, () => {
        this.init()
      })
    } else {
      audioContext.suspend()
      this.switchSong(musicIndex)
    }
  }

  prevSong() {
    const { firstPlay, audioContext } = this.state
    let { musicIndex, tracks } = this.state

    if (musicIndex <= 0) {
      musicIndex = tracks.length - 1
    } else {
      musicIndex -= 1
    }

    if (firstPlay) {
      this.setState({ isLoadingSong: true })
      this.setState({ firstPlay: false, musicIndex }, () => {
        this.init()
      })
    } else {
      audioContext.suspend()
      this.switchSong(musicIndex)
    }
  }

  switchSong(musicIndex) {
    let {
      tracks,
      currentSource,
    } = this.state

    const { isLoadingSong } = this.state

    this.timeHandler()

    if (!isLoadingSong) {
      this.setState({ isLoadingSong: true })
    }

    if (currentSource) {
      currentSource.disconnect()
      this.setState({ playing: false })
    }

    this.setState({ musicIndex, playingFullMusic: false, canLoadFullSong: true }, () => this.loadSong(tracks[musicIndex].url))
  }

  canvasConfigure(resolve) {
    let { canvas, canvasContext } = this.state
    canvas = document.querySelector('#Player-canvas')
    canvasContext = canvas.getContext('2d')
    canvasContext.strokeStyle = '#61dafb'

    this.setState({
      canvas,
      canvasContext
    }, () => {
      this.calculateSize(resolve)
    })
  }

  calculateSize(resolve) {
    let { canvas } = this.state
    const padding = 120
    const minSize = 740
    const optimiseHeight = 982

    const canvasScaleCoef = Math.max(0.5, 740 / optimiseHeight)

    const size = Math.max(minSize, 1 /*document.body.clientHeight */)
    canvas.setAttribute('width', size)
    canvas.setAttribute('height', size)

    const canvasWidth = size
    const canvasHeight = size

    const sceneRadius = (size - padding * 2) / 2
    const canvasCx = sceneRadius + padding
    const canvasCy = sceneRadius + padding
    const canvasCoord = canvas.getBoundingClientRect()

    this.setState({
      canvas,
      canvasWidth,
      canvasHeight,
      canvasScaleCoef,
      canvasCx,
      canvasCy,
      canvasCoord,
      sceneRadius
    }, () => resolve ? resolve() : null)
  }

  framerInit() {
    let {
      canvasScaleCoef,
      framerTickSize,
      framerCountTicks
    } = this.state

    const framerMaxTickSize = framerTickSize * 9 * canvasScaleCoef
    framerCountTicks = 360 * canvasScaleCoef

    this.setState({ framerCountTicks, framerMaxTickSize})
  }

  sceneInit() {
    this.sceneInitHandlers()

    this.framerInit()
    this.trackerInit()
    this.timeHandler()

    this.startSceneRender()

    setInterval(() => {
      this.timeHandler()
      this.songContextHandler()
    }, 300)
  }

  sceneInitHandlers() {
    window.onresize = () => {
      this.canvasConfigure()
      this.framerInit()
      this.sceneRender()

      this.setState({ canvasResized: true })
    }
  }

  startSceneRender() {
    this.setState({ sceneInProcess: true })
    this.sceneRender()
  }

  sceneRender() {
    if (this.state.canvasFirstDraw || this.state.canvasResized) {
      this.sceneClear()
      this.sceneDraw()
      this.setState({ canvasFirstDraw: false, canvasResized: false })
    }

    requestAnimationFrame(() => {
      if (this.state.playing) {
        this.sceneClear()
        this.sceneDraw()
      }
      if (this.state.sceneInProcess) {
        this.sceneRender()
      }
    })
  }

  sceneClear() {
    const {
      canvasWidth,
      canvasHeight,
      canvasContext
    } = this.state

    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  sceneDraw() {
    this.framerDraw()
    this.trackerDraw()
    this.controlsDraw()
  }

  controlsDraw() {
    const {
      canvasContext,
      trackerR,
      trackerAngle,
      sceneRadius,
      scenePadding,
      trackerEnabled,
      hasStreamSupport
    } = this.state

    if (trackerEnabled || !hasStreamSupport) {
      canvasContext.save()
      canvasContext.beginPath()
      canvasContext.fillStyle = 'rgba(97, 218, 251, 0.85)'
      canvasContext.lineWidth = 1
      let x = trackerR / Math.sqrt(Math.pow(Math.tan(trackerAngle), 2) + 1)
      let y = Math.sqrt(trackerR * trackerR - x * x)
      if (this.controlsGetQuadrant() === 2) {
        x = -x
      }
      if (this.controlsGetQuadrant() === 3) {
        x = -x
        y = -y
      }
      if (this.controlsGetQuadrant() === 4) {
        y = -y
      }
      canvasContext.arc(sceneRadius + scenePadding + x, sceneRadius + scenePadding + y, 10, 0, Math.PI * 2, false)
      canvasContext.fill()
      canvasContext.restore()
    }
  }

  controlsGetQuadrant() {
    const { trackerAngle } = this.state

    if (0 <= trackerAngle && trackerAngle < Math.PI / 2) {
      return 1
    }
    if (Math.PI / 2 <= trackerAngle && trackerAngle < Math.PI) {
      return 2
    }
    if (Math.PI < trackerAngle && trackerAngle < Math.PI * 3 / 2) {
      return 3
    }
    if (Math.PI * 3 / 2 <= trackerAngle && trackerAngle <= Math.PI * 2) {
      return 4
    }
  }

  framerDraw() {
    this.framerDrawTicks()
    this.framerDrawEdging()
  }

  framerDrawTicks() {
    const { canvasContext } = this.state
    let { framerTicks } = this.state

    canvasContext.save()
    canvasContext.beginPath()
    canvasContext.lineWidth = 1
    framerTicks = this.framerGetTicks([0, 90])
    for (let i = 0, len = framerTicks.length; i < len; ++i) {
      const tick = framerTicks[i]
      this.framerDrawTick(tick.x1, tick.y1, tick.x2, tick.y2)
    }
    canvasContext.restore()

    this.setState({ framerTicks })
  }

  framerDrawTick(x1, y1, x2, y2) {
    const {
      canvasCx,
      canvasCy,
      canvasContext
    } = this.state

    const dx1 = parseInt(canvasCx + x1)
    const dy1 = parseInt(canvasCy + y1)

    const dx2 = parseInt(canvasCx + x2)
    const dy2 = parseInt(canvasCy + y2)

    const gradient = canvasContext.createLinearGradient(dx1, dy1, dx2, dy2)
    gradient.addColorStop(0, '#61dafb')
    gradient.addColorStop(0.6, '#61dafb')
    gradient.addColorStop(1, '#F5F5F5')
    canvasContext.beginPath()
    canvasContext.strokeStyle = gradient
    canvasContext.lineWidth = 2
    canvasContext.moveTo(canvasCx + x1, canvasCx + y1)
    canvasContext.lineTo(canvasCx + x2, canvasCx + y2)
    canvasContext.stroke()
  }

  framerGetTicks(animationParams) {
    this.setState({ framerTickSize: 10 })

    const {
      canvas,
      framerTickSize,
      framerFrequencyData,
      canvasScaleCoef,
      framerTransformScale,
      sceneRadius,
      initialFixedTicks
    } = this.state

    const ticks = this.framerGetTickPoints()
    let x1, y1, x2, y2, ticksArray = [], tick, k
    const lesser = 160
    const allScales = []
    for (let i = 0, len = ticks.length; i < len; ++i) {
      const coef = 1 - i / (len * 2.5)
      let delta = 0

      if (this.state.gainNode) {
        switch (this.state.gainNode.gain.value) {
          case 0:
              delta = 0
            break

          case 0.5:
            delta = (((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef) / 2
            break

          case 1:
            delta = ((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef
            break

          default:
            delta = ((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef
            break
        }
      }

      if (delta < 0) {
        delta = 0
      }

      tick = ticks[i]
      if (initialFixedTicks) {
        if (animationParams[0] <= tick.angle && tick.angle <= animationParams[1]) {
          k = sceneRadius / (sceneRadius - this.framerGetSize(tick.angle, animationParams[0], animationParams[1]) - delta)
        } else {
          k = sceneRadius / (sceneRadius - (framerTickSize + delta))
        }
      } else {
        k = sceneRadius / (sceneRadius - (framerTickSize + delta))
      }
      x1 = tick.x * (sceneRadius - framerTickSize)
      y1 = tick.y * (sceneRadius - framerTickSize)
      x2 = x1 * k
      y2 = y1 * k
      ticksArray.push({ x1: x1, y1: y1, x2: x2, y2: y2 })
      if (i < 20) {
        let scale = delta / 50
        scale = scale < 1 ? 1 : scale
        allScales.push(scale)
      }
    }
    const sum = allScales.reduce((pv, cv) => { return pv + cv }, 0) / allScales.length
    if (framerTransformScale) {
      canvas.style.transform = `scale('${sum}')`
    }
    return ticksArray
  }

  framerGetSize(angle, l, r) {
    const {
      framerMaxTickSize,
      framerTickSize,
      framerIndex,
      framerCountTicks
    } = this.state
    const m = (r - l) / 2
    const x = (angle - l)
    let size

    if (x === m) {
      return framerMaxTickSize
    }
    const diameter = Math.abs(m - x)
    const v = 70 * Math.sqrt(1 / diameter)
    if (v > framerMaxTickSize) {
      size = framerMaxTickSize - diameter
    } else {
      size = Math.max(framerTickSize, v)
    }

    if (framerIndex > framerCountTicks) {
      this.setState({ framerIndex: 0 })
    }

    return size
  }

  framerGetTickPoints() {
    const {
      framerCountTicks,
      framerPI
    } = this.state
    const coords = [], step = framerPI / framerCountTicks

    for (let deg = 0; deg < framerPI; deg += step) {
      const rad = deg * Math.PI / (framerPI / 2)
      coords.push({ x: Math.cos(rad), y: -Math.sin(rad), angle: deg })
    }

    return coords
  }

  framerDrawEdging() {
    const {
      trackerLineWidth,
      trackerInnerDelta,
      canvasCx,
      canvasCy,
      sceneRadius,
      canvasContext,
      scenePadding,
      framerLoadingAngle
    } = this.state

    canvasContext.save()
    canvasContext.beginPath()
    canvasContext.strokeStyle = 'rgba(97, 218, 251, 0.5)'
    canvasContext.lineWidth = 1

    const offset = trackerLineWidth / 2
    canvasContext.moveTo(scenePadding + 2 * sceneRadius - trackerInnerDelta - offset, scenePadding + sceneRadius)
    canvasContext.arc(canvasCx, canvasCy, sceneRadius - trackerInnerDelta - offset, 0, framerLoadingAngle, false)

    canvasContext.stroke()
    canvasContext.restore()
  }

  framerSetLoadingPercent(percent) {
    this.setState({ framerLoadingAngle: percent * 2 * Math.PI })
  }

  trackerInit() {
    // let {
    //   canvas,
    //   trackerAngle,
    //   trackerPressButton,
    //   trackerAnimatedInProgress,
    //   audioContext,
    //   currentSource,
    //   sceneInProcess
    // } = this.state

    // canvas.addEventListener('mousedown', event => {
    //   if (this.trackerIsInsideOfSmallCircle(event) || this.trackerIsOusideOfBigCircle(event)) {
    //     return
    //   }
    //   this.setState({ trackerPressButton: true, trackerPrevAngle: trackerAngle})
    //   this.trackerStopAnimation()
    //   this.setState({ trackerAnimatedInProgress: true})
    //   this.trackerCalculateAngle(event)
    // })

    // window.addEventListener('mouseup', () => {
    //   if (!trackerPressButton) {
    //     return
    //   }
    //   const id = setInterval(() => {
    //     if (!trackerAnimatedInProgress) {
    //       this.setState({ trackerPressButton: false })
    //       audioContext.currentTime = trackerAngle / (2 * Math.PI) * currentSource.buffer.duration

    //       clearInterval(id)
    //     }
    //   }, 100)
    // })

    // window.addEventListener('mousemove', event =>  {
    //   if (trackerAnimatedInProgress) {
    //     return
    //   }
    //   if (trackerPressButton && sceneInProcess) {
    //     this.trackerCalculateAngle(event)
    //   }
    // })
  }

  trackerDraw() {
    const {
      currentSource,
      audioContext,
      trackerPressButton,
      audioLoadOffsetTime,
      isLoadingSong
    } = this.state

    if (currentSource !== null && this.state.trackerEnabled) {
      if (!currentSource.buffer) {
        return
      }

      if (!trackerPressButton) {
        const angle = (audioContext.currentTime - audioLoadOffsetTime) / currentSource.buffer.duration * 2 * Math.PI || 0
        this.setState({ trackerAngle: angle })
      }

      if (!isLoadingSong) {
        this.trackerDrawArc()
      }
    }
  }

  trackerDrawArc() {
    let {
      canvasContext,
      sceneRadius,
      trackerInnerDelta,
      scenePadding,
      trackerLineWidth,
      trackerAngle
    } = this.state

    canvasContext.save()
    canvasContext.strokeStyle = 'rgba(97, 218, 251, 0.8)'
    canvasContext.beginPath()
    canvasContext.lineWidth = trackerLineWidth

    const trackerR = sceneRadius - (trackerInnerDelta + trackerLineWidth / 2)
    canvasContext.arc(
      sceneRadius + scenePadding,
      sceneRadius + scenePadding,
      trackerR, 0, trackerAngle, false
    )
    canvasContext.stroke()
    canvasContext.restore()
  }

  trackerStartAnimation() {
    const {
      trackerAnimationCount,
      trackerPrevAngle,
      trackerAngle
    } = this.state

    let angle = trackerAngle
    const l = Math.abs(trackerAngle) - Math.abs(trackerPrevAngle)
    let step = l / trackerAnimationCount, i = 0

    const calc = () => {
      angle += step
      if (++i === trackerAnimationCount) {
        this.setState({
          trackerAngle: angle,
          trackerPrevAngle: angle,
          trackerAnimatedInProgress: false
        })
      } else {
        this.setState({ trackerAnimateId: setTimeout(calc, 20) })
      }
    }
  }

  trackerStopAnimation() {
    clearTimeout(this.state.trackerAnimateId)
    this.setState({trackerAnimatedInProgress: false})
  }

  trackerCalculateAngle(event) {
    const {
      canvasCx,
      canvasCy,
      canvasCoord,
      canvasContext,
      animatedInProgress,
      trackerAngle,
      isLoadingSong
    } = this.state

    const mx = event.pageX
    const my = event.pageY
    let angle = Math.atan((my - canvasCy - canvasCoord.top) / (mx - canvasCx - canvasCoord.left))

    if (mx < canvasContext + canvasCoord.left) {
      angle = Math.PI + angle
    }
    if (angle < 0) {
      angle += 2 * Math.PI
    }

    this.setState({ trackerAngle: angle })

    if (animatedInProgress && !isLoadingSong) {
      this.trackerStartAnimation()
    } else {
      this.setState({ trackerPrevAngle: trackerAngle})
    }
  }

  trackerIsInsideOfSmallCircle(event) {
    let {
      canvasCx,
      canvasCy,
      canvasCoord,
      sceneRadius,
      trackerInnerDelta
    } = this.state

    const x = Math.abs(event.pageX - canvasCx - canvasCoord.left)
    const y = Math.abs(event.pageY - canvasCy - canvasCoord.top)

    return Math.sqrt(x * x + y * y) < sceneRadius - 3 * trackerInnerDelta
  }

  trackerIsOusideOfBigCircle (event) {
    let {
      canvasCx,
      canvasCy,
      canvasCoord,
      sceneRadius
    } = this.state
    return Math.abs(event.pageX - canvasCx - canvasCoord.left) > sceneRadius ||
      Math.abs(event.pageY - canvasCy - canvasCoord.top) > sceneRadius
  }

  timeHandler() {
    const {
      audioContext,
      audioLoadOffsetTime,
      currentSource
    } = this.state

    let {
      timeControl
    } = this.state

    let rawTime = 0

    if (audioContext && audioContext.state !== 'suspended' && currentSource) {
      // When start time of the track from the middle for example, need add a startTime (offset) into calc
      // let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime - startTime
      let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime

      rawTime = parseInt(audioCurrentTime || 0)

      const secondsInMin = 60
      let min = parseInt(rawTime / secondsInMin)
      let seconds = rawTime - min * secondsInMin
      if (min < 10) {
        min = `0${min}`
      }
      if (seconds < 10) {
        seconds = `0${seconds}`
      }
      const time = `${min}:${seconds}`
      timeControl.textContent = time
    }
  }

  songContextHandler() {
    const {
      audioContext,
      currentSource,
      audioLoadOffsetTime,
      playingFullMusic,
      hasStreamSupport,
      isLoadingFullSong,
      canLoadFullSong,
      threadInUse
    } = this.state

    if (audioContext && audioContext.state !== 'suspended' && currentSource) {
      let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime
      const currentDuration = currentSource.buffer.duration

      // console.log({playingFullMusic, canLoadFullSong, isLoadingFullSong})

      if (audioCurrentTime >= (currentDuration - 3.5) && !playingFullMusic && hasStreamSupport && !isLoadingFullSong && canLoadFullSong) {
        this.setState({ isLoadingFullSong: true })
        if (threadInUse === 'main') {
          this.preLoadCompleteSong()
        } else if (threadInUse === 'worker') {
          this.audioWorker.postMessage({ type: 'preload', data: { playingFullMusic, all: true } })
        }
      } else {
        // console.log(audioCurrentTime, currentDuration, audioCurrentTime >= currentDuration)
        if (playingFullMusic && audioCurrentTime >= (currentDuration - 1.5) && !isLoadingFullSong ) {
          this.nextSong()
        }
      }
    }
  }

  changeVolume() {
    let { gainNode } = this.state

    if (gainNode == null) {
      return
    }

    switch (gainNode.gain.value) {
      case 0:
          gainNode.gain.value = 0.5
        break

      case 0.5:
          gainNode.gain.value = 1
        break

      case 1:
          gainNode.gain.value = 0
        break

      default:
        break
    }

    this.setState({ gainNode, updatedVolume: true })
  }

  getVolume() {
    const { gainNode } = this.state

    if (gainNode == null) {
      return 1
    }

    return gainNode.gain.value
  }

  getSongName() {
    const { tracks, musicIndex } = this.state
    if (tracks[musicIndex]) {
      return tracks[musicIndex].name || 'No Music Name Found'
    }
  }
  getSongArtist() {
    const { tracks, musicIndex } = this.state
    if (tracks[musicIndex]) {
      return tracks[musicIndex].artist || 'No Music Artist Found'
    }
  }

  /**
   * React Render
   */
  render() {
    return (
      <div className='Audio'>
          <div className='Player'>
            <canvas id='Player-canvas' key='Player-canvas'></canvas>
            <div className='song-info'>
              <div className='song-artist'>{this.getSongArtist()}</div>
              <div className='song-name'>{this.getSongName()}</div>
            </div>
            <div className='controls'>
              <div className='prev-song'>
                <FastRewind style={{ fontSize: '72px', color: 'rgba(97, 218, 251, 0.8)', margin: '1rem', cursor: 'pointer' }} onClick={this.prevSong} />
              </div>
              <div className='pause-play-song'>
              { this.state.isLoadingSong
                ? <div className='loader'><div></div><div></div></div>
                : !this.state.playing
                    ? <PlayArrow style={{ fontSize: '72px', color: 'rgba(97, 218, 251, 0.8)', margin: '1rem', cursor: 'pointer' }} onClick={this.resumeSong} />
                    : <Pause style={{ fontSize: '72px', color: 'rgba(97, 218, 251, 0.8)', margin: '1rem', cursor: 'pointer' }} onClick={this.suspendSong} />
                }
              </div>
              <div className='next-song'>
                <FastForward style={{ fontSize: '72px', color: 'rgba(97, 218, 251, 0.8)', margin: '1rem', cursor: 'pointer' }} onClick={this.nextSong} />
              </div>
            </div>
            <div className='song-footer'>
              <div className='song-gain'>{
                this.getVolume() === 0
                  ? <VolumeMute style={{ cursor: 'pointer' }} onClick={this.changeVolume} />
                  : this.getVolume() < 1
                    ? <VolumeDown style={{ cursor: 'pointer' }} onClick={this.changeVolume} />
                    : <VolumeUp style={{ cursor: 'pointer' }} onClick={this.changeVolume} />
                }
              </div>
            <div className='song-duration'>{this.state.timeControl.textContent}</div>
            </div>
          </div>
      </div>
    )
  }
}

Audio.contextType = appContext

export default Audio
