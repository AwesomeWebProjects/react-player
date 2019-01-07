import React, { Component } from 'react'
import './style.css'
import rise from '../../assets/rise.mp3'
import fantastic from '../../assets/fantastic.mp3'
import ParticleButton from '../button/component'
import buttonSamples from './button-samples'
import {
  PlayArrow,
  Pause,
  FastForward,
  FastRewind
} from '@material-ui/icons'

class Audio extends Component {
  constructor(props) {
    super(props)

    /**
     * state
     */
    this.state = {
      /**
       * Audio Context
       */
      audioContext: null,
      analyser: null,
      gainNode: null,
      currentSource: null,
      bufferLength: null,
      duration: 0,
      tracks: [
        rise,
        fantastic
      ],
      musicIndex: 0,
      playing: false,
      javascriptNode: null,

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
      timeControl: {},

      /**
       * Misc
       */
      playerInitalized: false,
      initialFixedTicks: false
    }

    /**
     * vars
     */
    this.initButton = buttonSamples[12].buttonStyles
    this.initButtonOptions = buttonSamples[12].buttonOptions

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
  }

  showPlayer() {
    this.setState({ playerInitalized: true})

    this.framerSetLoadingPercent(1)
    this.sceneInit()
  }

  startPlayer() {
    this.init()
  }

  init() {
    try {
      const { tracks, musicIndex } = this.state
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      analyser.fftSize = 2048
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      javascriptNode.onaudioprocess = () => {
        analyser.getByteFrequencyData(this.state.framerFrequencyData) // For Bits
        // analyser.getByteTimeDomainData(this.state.framerFrequencyData) // For Waves
      };

      this.setState({
        audioContext,
        analyser,
        gainNode,
        dataArray,
        bufferLength,
        framerFrequencyData: dataArray,
        javascriptNode
      })

      this.loadSong(tracks[musicIndex])
    } catch (error) {
      console.error(error)
      console.error('Web Audio API is not supported in this browser')
    }
  }

  loadSong(url) {
    const { audioContext } = this.state
    const request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = 'arraybuffer'

    // Decode asynchronously
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        const currentSource = audioContext.createBufferSource()
        currentSource.buffer = buffer
        console.log(currentSource)

        this.setState({ currentSource })

        this.playSound(currentSource)
      }, function (error) {
        console.error(error)
      })
    }
    request.send()
  }

  playSound(source) {
    const {
      audioContext,
      analyser,
      gainNode,
      javascriptNode
    } = this.state

    source.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)
    javascriptNode.connect(audioContext.destination)

    // Reduce the volume.
    gainNode.gain.value = 0.5

    source.start(0)

    this.setState({ playing: true })
  }

  suspendSong() {
    this.state.audioContext.suspend()
    this.setState({ playing: false })
  }

  resumeSong() {
    this.state.audioContext.resume()
    this.setState({ playing: true })
  }

  nextSong() {
    let {
      musicIndex,
      tracks,
    } = this.state

    if (musicIndex >= (tracks.length - 1)) {
      musicIndex = 0
    } else {
      musicIndex = + 1
    }

    this.switchSong(musicIndex)
  }

  prevSong() {
    let {
      musicIndex,
      tracks
    } = this.state

    if (musicIndex <= 0) {
      musicIndex = tracks.length - 1
    } else {
      musicIndex = - 1
    }

    this.switchSong(musicIndex)
  }

  switchSong(musicIndex) {
    let {
      tracks,
      currentSource
    } = this.state

    if (currentSource) {
      currentSource.disconnect()
      this.setState({ playing: false, musicIndex })
    }

    this.loadSong(tracks[musicIndex])
  }

  canvasConfigure() {
    let { canvas, canvasContext } = this.state
    canvas = document.querySelector('#Player-canvas')
    canvasContext = canvas.getContext('2d')
    canvasContext.strokeStyle = '#61dafb'

    this.setState({
      canvas,
      canvasContext
    })

    this.calculateSize()
  }

  calculateSize() {
    let { canvas } = this.state
    const padding = 120
    const minSize = 740
    const optimiseHeight = 982

    const canvasScaleCoef = Math.max(0.5, 740 / optimiseHeight)

    const size = Math.max(minSize, 1 /*document.body.clientHeight */)
    canvas.setAttribute('width', size)
    canvas.setAttribute('height', size)
    //this.canvas.style.marginTop = -size / 2 + 'px'
    //this.canvas.style.marginLeft = -size / 2 + 'px'

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
    })
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

  initTimeHandler() {
    let {
      audioContext,
      timeControl
    } = this.state

    setTimeout(() => {
      const rawTime = parseInt(audioContext.currentTime || 0)
      const secondsInMin = 60
      let min = parseInt(rawTime / secondsInMin)
      let seconds = rawTime - min * secondsInMin
      if (min < 10) {
        min = '0' + min
      }
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      const time = min + ':' + seconds
      timeControl.textContent = time

      this.setState({ timeControl })

      this.initTimeHandler()
    }, 300)
  }

  sceneInit() {
    this.canvasConfigure()
    this.sceneInitHandlers()

    this.framerInit()
    this.trackerInit()
    this.initTimeHandler()

    this.startSceneRender()
  }

  sceneInitHandlers() {
    window.onresize = () => {
      this.canvasConfigure()
      this.framerInit()
      this.sceneRender()
    };
  }

  startSceneRender() {
    this.setState({ sceneInProcess: true })
    this.sceneRender()
  }

  sceneRender() {
    requestAnimationFrame(() => {
      this.sceneClear()
      this.sceneDraw()
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
      scenePadding
    } = this.state

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

  controlsGetQuadrant() {
    const { trackerAngle } = this.state

  if (0 <= trackerAngle && trackerAngle < Math.PI / 2) {
    return 1;
  }
  if (Math.PI / 2 <= trackerAngle && trackerAngle < Math.PI) {
    return 2;
  }
  if (Math.PI < trackerAngle && trackerAngle < Math.PI * 3 / 2) {
    return 3;
  }
  if (Math.PI * 3 / 2 <= trackerAngle && trackerAngle <= Math.PI * 2) {
    return 4;
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
    let x1, y1, x2, y2, m = [], tick, k
    const lesser = 160
    const allScales = []
    for (let i = 0, len = ticks.length; i < len; ++i) {
      const coef = 1 - i / (len * 2.5)
      let delta = ((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef
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
      m.push({ x1: x1, y1: y1, x2: x2, y2: y2 })
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
    return m
  }

  framerGetSize(angle, l, r) {
    const {
      framerMaxTickSize,
      framerTickSize,
      framerIndex,
      framerCountTicks
    } = this.state
    const m = (r - l) / 2;
    const x = (angle - l);
    let h;

    if (x === m) {
      return framerMaxTickSize;
    }
    const d = Math.abs(m - x);
    const v = 70 * Math.sqrt(1 / d);
    if (v > framerMaxTickSize) {
      h = framerMaxTickSize - d;
    } else {
      h = Math.max(framerTickSize, v);
    }

    if (framerIndex > framerCountTicks) {
      this.setState({ framerIndex: 0 })
    }

    return h;
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
    let {
      canvas,
      trackerAngle,
      trackerPressButton,
      trackerAnimatedInProgress,
      audioContext,
      currentSource,
      sceneInProcess
    } = this.state

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
      trackerPressButton
    } = this.state

    if (currentSource !== null) {
      if (!currentSource.buffer) {
        return;
      }

      if (!trackerPressButton) {
        const angle = audioContext.currentTime / currentSource.buffer.duration * 2 * Math.PI || 0;
        this.setState({ trackerAngle: angle })
      }

      this.trackerDrawArc();
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
    const f = () => {
      angle += step
      if (++i === trackerAnimationCount) {
        this.setState({
          trackerAngle: angle,
          trackerPrevAngle: angle,
          trackerAnimatedInProgress: false
        })
      } else {
        this.setState({ trackerAnimateId: setTimeout(f, 20) })
      }
    }

    // this.angle = this.prevAngle
    // this.animateId = setTimeout(f, 20)
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
      trackerAngle
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

    if (animatedInProgress) {
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

  /**
   * React Render
   */
  render() {
    return (
      <div className="Audio">
        <ParticleButton
          text="Play"
          background="transparent"
          buttonStyles={this.initButton}
          buttonOptions={this.initButtonOptions}
          onStartAnimation={this.startPlayer}
          onFinishAnimation={this.showPlayer}>
        </ParticleButton>
        { this.state.playerInitalized ?
          <div className="Player">
            <canvas id="Player-canvas" key="Player-canvas"></canvas>
            <div className="controls">
              <div className="back-song">
                <FastRewind style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.prevSong} />
              </div>
              <div className="pause-play-song">
                {
                  !this.state.playing
                    ? <PlayArrow style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.resumeSong} />
                    : <Pause style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.suspendSong} />
                }
              </div>
              <div className="next-song">
                <FastForward style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.nextSong} />
              </div>
            </div>
            <div className="song-info">
              <div className="name">Song Name</div>
            </div>
          </div>
        : null }
      </div>
    )
  }
}

export default Audio
