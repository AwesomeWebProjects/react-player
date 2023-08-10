import { memo, useEffect, useState } from 'react'
import classNames from 'classnames'
import type { IController } from './ControllerTypes'
import { useAppGlobalStateApi, useAppGlobalStateData } from '../../contexts/AppContext'
import { Player } from '../Player'

const tracks = [
  {
    name: 'Small Piece of music LND',
    artist: 'League of Legends',
    url: '/assets/music/short-legends-never-die.mp3',
  },
  {
    name: 'Legends Never Die',
    artist: 'League of Legends',
    url: '/assets/music/legends-never-die.mp3',
  },
  {
    name: 'Rise',
    artist: 'League of Legends',
    url: '/assets/music/rise.mp3',
  },
  {
    name: 'Fantastic - Cinematic Sound',
    artist: 'AudioJungle',
    url: '/assets/music/fantastic.mp3',
  },
]

const Controller = ({ className, ...rest }: IController) => {
  const {
    setAudioContext,
    setCurrentSource,
    setAnalyser,
    setGainNode,
    setCurrentBuffer,
    setPlaying,
  } = useAppGlobalStateApi()
  const {
    audioContext,
    analyser,
    gainNode,
    javascriptNode,
    currentSource,
    updatedVolume,
    currentBuffer,
    playing,
  } = useAppGlobalStateData()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) {
      loadSong(tracks[1].url)
    }
  }, [initialized])

  useEffect(() => {
    /**
     * the used buffer to play the song will be `currentSource.buffer` that is being updated by memory reference.
     * We are only using `currentBuffer` state to know when the buffer of `currentShource.buffer` is available.
     */
    if (initialized && currentBuffer) {
      playSong()
    }
  }, [currentBuffer])

  const readAudioStream = (
    response: Response,
    contentLength: string | null,
    params?: {
      all: boolean
      sec: number
      amount: number
    },
  ) => {
    const total = parseInt(contentLength as string, 10)
    let loaded = 0
    const startedStream: any = new Date()

    const stream = new ReadableStream({
      start(controller) {
        if (!response.body) {
          return
        }

        const reader: ReadableStreamDefaultReader = response.body.getReader()
        const read = () => {
          reader
            .read()
            .then(({ done, value }) => {
              if (params && !params.all) {
                if (params.amount) {
                  if (params.amount < total && loaded >= params.amount) {
                    console.log(`Close stream frag - amount`)
                    reader.releaseLock()
                    controller.close()
                    return
                  }
                  if (loaded >= 65536 * 5) {
                    // 327.680
                    console.log(`Close stream frag - amount`)
                    reader.releaseLock()
                    controller.close()
                    return
                  }
                } else {
                  const startedStreamTime = ((new Date() as any) - startedStream) / 1000
                  if (startedStreamTime >= (params.sec || 5)) {
                    console.log(`Close stream frag - time`)
                    reader.releaseLock()
                    controller.close()
                    return
                  }
                }
              }
              if (done) {
                console.log(`Close stream done`)
                // that.setState({ playingFullMusic: true })
                reader.releaseLock()
                controller.close()
                return
              }

              loaded += value.byteLength
              console.log(
                { loaded, total, percent: `${((loaded * 100) / total).toFixed(2)}%` },
                ((new Date() as any) - startedStream) / 1000,
              )
              controller.enqueue(value)

              read()
            })
            .catch((error: any) => {
              console.error(error)
              controller.error(error)
            })
        }

        read()
      },
    })

    return stream
  }

  const loadSong = async (url: string) => {
    const response = await fetch(url)

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

    // need to be saved in state to be used later
    const audioStreamData = {
      response: response.clone(),
      contentLength: response.headers.get('content-length'),
    }

    const stream = readAudioStream(audioStreamData.response, audioStreamData.contentLength, {
      all: true,
      sec: 1,
      amount: 1050478,
    })
    const streamAsResponse = new Response(stream)
    const audioBuffer = await streamAsResponse.arrayBuffer()

    console.log(audioContext)

    audioContext.decodeAudioData(audioBuffer, (buffer: Buffer) => {
      currentSource.buffer = buffer

      setCurrentBuffer(buffer)

      // playSong()
    })

    console.log(audioStreamData)
  }

  const playSong = (when = null, offset = null) => {
    const source = currentSource
    source.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // deprecated - need use audio worklet
    // javascriptNode.connect(audioContext.destination)

    // Set the start volume to 100%. // 50% = 0.5
    if (gainNode && !updatedVolume) {
      gainNode.gain.value = 1
    }

    if (when && offset) {
      source.start(when, offset)
    } else {
      source.start(0)
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    setPlaying(true)
  }

  const initialize = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioContext()

    const newAnalyser = audioCtx.createAnalyser()
    const newGainNode = audioCtx.createGain()

    newAnalyser.fftSize = 2048
    const bufferLength = newAnalyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const newCurrentSource = audioCtx.createBufferSource()

    setAudioContext(audioCtx)
    setCurrentSource(newCurrentSource)
    setAnalyser(newAnalyser)
    setGainNode(newGainNode)

    setInitialized(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('initialize', initialize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('initialize', initialize)
      }
    }
  }, [])

  return <Player />
}

export default memo(Controller)
