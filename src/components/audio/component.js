import React, { Component } from 'react'
import './style.css'
import rise from '../../assets/rise.mp3'
import fantastic from '../../assets/fantastic.mp3'
import ParticleButton from '../button/component'
import buttonSamples from './button-samples'
import {
  PlayCircleOutline,
  PauseCircleOutline,
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
      tracks: [
        rise,
        fantastic
      ],
      musicIndex: 0,
      playing: false,

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
       * Misc
       */
      playerInitalized: false
    }

    /**
     * vars
     */
    this.initButton = buttonSamples[12].buttonStyles
    this.initButtonOptions = buttonSamples[12].buttonOptions

    /**
     * functions
     */
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
    this.drawArc = this.drawArc.bind(this)
  }

  showPlayer() {
    this.setState({ playerInitalized: true})

    this.initCanvas()
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
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      analyser.fftSize = 2048
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteTimeDomainData(dataArray)

      this.setState({
        audioContext,
        analyser,
        gainNode,
        dataArray,
        bufferLength
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

        this.setState({
          currentSource
        })

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
      gainNode
    } = this.state

    source.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)

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
      musicIndex = 0;
    } else {
      musicIndex = + 1;
    }

    this.switchSong(musicIndex)
  }

  prevSong() {
    let {
      musicIndex,
      tracks
    } = this.state

    if (musicIndex <= 0) {
      musicIndex = tracks.length - 1;
    } else {
      musicIndex = - 1;
    }

    this.switchSong(musicIndex)
  }

  switchSong(musicIndex) {
    let {
      tracks,
      currentSource
    } = this.state

    if (currentSource) {
      currentSource.disconnect();
      this.setState({ playing: false, musicIndex })
    }

    this.loadSong(tracks[musicIndex]);
  }

  initCanvas() {
    let { canvas, canvasContext } = this.state
    canvas = document.querySelector('#Player-canvas');
    canvasContext = canvas.getContext('2d');
    canvasContext.strokeStyle = '#FE4365';

    this.setState({
      canvas,
      canvasContext
    })

    this.calculateSize();
  }

  calculateSize() {
    let { canvas } = this.state
    const padding = 120
    const minSize = 740
    const optimiseHeight = 982

    const canvasScaleCoef = Math.max(0.5, 740 / optimiseHeight);

    const size = Math.max(minSize, 1/*document.body.clientHeight */);
    canvas.setAttribute('width', size);
    canvas.setAttribute('height', size);
    //this.canvas.style.marginTop = -size / 2 + 'px';
    //this.canvas.style.marginLeft = -size / 2 + 'px';

    const canvasWidth = size;
    const canvasHeight = size;

    const radius = (size - padding * 2) / 2;
    const canvasCx = radius + padding;
    const canvasCy = radius + padding;
    const canvasCoord = canvas.getBoundingClientRect();

    this.setState({
      canvas,
      canvasWidth,
      canvasHeight,
      canvasScaleCoef,
      canvasCx,
      canvasCy,
      canvasCoord
    })
  }

  drawArc() {
    let { canvasContext } = this.state

    canvasContext.save()
    canvasContext.strokeStyle = 'rgba(254, 67, 101, 0.8)'
    canvasContext.beginPath()
    canvasContext.lineWidth = this.lineWidth

    this.r = this.scene.radius - (this.innerDelta + this.lineWidth / 2)
    canvasContext.arc(
      this.scene.radius + this.scene.padding,
      this.scene.radius + this.scene.padding,
      this.r, 0, this.angle, false
    )
    canvasContext.stroke()
    canvasContext.restore()
  }

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
                    ? <PlayCircleOutline style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.resumeSong} />
                    : <PauseCircleOutline style={{ fontSize: '48px', margin: '1rem', cursor: 'pointer' }} onClick={this.suspendSong} />
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
