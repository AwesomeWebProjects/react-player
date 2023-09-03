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
    setIsLoadingSong,
    setFirstPlay,
    setPlayingFullMusic,
    setMusicIndex,
    setCanLoadFullSong,
    setAudioStreamData,
    setIsLoadingFullSong,
    setAudioContextCreatedTime,
    setTimeControl,
  } = useAppGlobalStateApi()
  const {
    audioContext,
    analyser,
    gainNode,
    javascriptNode,
    currentSource,
    updatedVolume,
    currentBuffer,
    firstPlay,
    musicIndex,
    isLoadingSong,
    audioStreamData,
    canLoadFullSong,
    audioLoadOffsetTime,
    audioContextCreatedTime,
    timeControl,
    playing,
    playingFullMusic,
    threadInUse,
    isLoadingFullSong,
    hasStreamSupport,
  } = useAppGlobalStateData()
  const [initialized, setInitialized] = useState(false)

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

    const tempAudioStreamData = {
      response: response.clone(),
      contentLength: response.headers.get('content-length'),
    }

    setAudioStreamData(tempAudioStreamData)

    const stream = readAudioStream(
      tempAudioStreamData.response,
      tempAudioStreamData.contentLength,
      {
        all: true,
        sec: 1,
        amount: 1050478,
      },
    )
    const streamAsResponse = new Response(stream)
    const audioBuffer = await streamAsResponse.arrayBuffer()

    const newCurrentSource = audioContext.createBufferSource()

    audioContext.decodeAudioData(audioBuffer, (buffer: Buffer) => {
      newCurrentSource.buffer = buffer

      setCurrentBuffer(buffer)
      setCurrentSource(newCurrentSource)
    })
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

  const preLoadCompleteSong = () => {
    new Promise((resolve) => {
      setAudioStreamData({
        response: audioStreamData.response.clone(),
        contentLength: audioStreamData.response.headers.get('content-length'),
      })

      const stream = readAudioStream(audioStreamData.response, audioStreamData.contentLength, {
        all: true,
        sec: 1,
        amount: 1050478,
      })
      resolve(new Response(stream))
    })
      .then((response: any) => {
        return response.arrayBuffer()
      })
      .then((responseBuffer) => {
        audioContext.decodeAudioData(
          responseBuffer,
          (buffer) => {
            if (canLoadFullSong) {
              currentSource.disconnect()

              const newCurrentSource = audioContext.createBufferSource()
              newCurrentSource.buffer = buffer

              const offset = audioContext.currentTime - audioLoadOffsetTime

              const source = newCurrentSource
              source.connect(analyser)
              analyser.connect(gainNode)
              gainNode.connect(audioContext.destination)
              javascriptNode.connect(audioContext.destination)

              source.start(offset, offset)

              if (audioContext.state === 'suspended') {
                audioContext.resume()
              }

              setPlaying(true)
              setIsLoadingFullSong(true)
              setCurrentSource(newCurrentSource)

              // @TODO: need to check if we need this code
              // this.setState({ currentSource }, () => {
              //   console.log('audio decoded and starting music from stream - full song loaded')
              //   const offset = audioContext.currentTime - audioLoadOffsetTime
              //   console.log({
              //     offset,
              //     duration: currentSource.buffer.duration,
              //   })

              //   setAudioContextCreatedTime(audioContextCreatedTime)
              // })
            }
          },
          function (error) {
            console.error(error)
          },
        )
      })
  }

  const timeHandler = () => {
    let rawTime = 0

    if (audioContext && audioContext.state !== 'suspended' && currentSource) {
      // When start time of the track from the middle, need add a startTime (offset) into the calc
      // let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime - startTime
      const audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime

      rawTime = Math.ceil(audioCurrentTime)

      const secondsInMin = 60
      let min: string | number = Math.ceil(rawTime / secondsInMin)
      let seconds: string | number = rawTime - min * secondsInMin

      if (min < 10) {
        min = `0${min}`
      }

      if (seconds < 10) {
        seconds = `0${seconds}`
      }
      const time = `${min}:${seconds}`
      timeControl.textContent = time

      setTimeControl(timeControl)
    }
  }

  const switchSong = (musicIdx: number) => {
    timeHandler()

    if (!isLoadingSong) {
      setIsLoadingSong(true)
    }

    if (currentSource) {
      currentSource.disconnect()
      setPlaying(false)
    }

    setMusicIndex(musicIdx)
    setPlayingFullMusic(false)
    setCanLoadFullSong(true)

    console.log('loading new song')
    // @TODO: maybe add this into a useEffect
    loadSong(tracks[musicIdx].url)
  }

  const suspendSong = () => {
    audioContext.suspend()
    setPlaying(false)
  }

  const resumeSong = () => {
    if (firstPlay) {
      setIsLoadingSong(true)

      setFirstPlay(false)

      window.dispatchEvent(new CustomEvent('react_player--initialize'))
    } else {
      audioContext.resume()
      setPlaying(true)
    }
  }

  const nextSong = () => {
    console.log('next song - current index: ', musicIndex, 'first play: ', firstPlay)
    let newMusicIndex = musicIndex

    if (musicIndex >= tracks.length - 1) {
      newMusicIndex = 0
    } else {
      newMusicIndex += 1
    }

    // if (firstPlay) {
    setIsLoadingSong(true)
    setMusicIndex(newMusicIndex)
    //   setFirstPlay(false)

    //   // window.dispatchEvent(new CustomEvent('react_player--initialize'))
    // } else {
    audioContext.suspend()
    switchSong(musicIndex)
    // }
  }

  const prevSong = () => {
    let newMusicIndex = musicIndex

    if (musicIndex <= 0) {
      newMusicIndex = tracks.length - 1
    } else {
      newMusicIndex -= 1
    }

    if (firstPlay) {
      setIsLoadingSong(true)
      setMusicIndex(newMusicIndex)
      setFirstPlay(false)

      window.dispatchEvent(new CustomEvent('react_player--initialize'))
    } else {
      audioContext.suspend()
      switchSong(newMusicIndex)
    }
  }

  const songContextHandler = () => {
    if (audioContext && audioContext.state !== 'suspended' && currentSource) {
      let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime
      const currentDuration = currentSource.buffer.duration

      // console.log({playingFullMusic, canLoadFullSong, isLoadingFullSong})

      if (
        audioCurrentTime >= currentDuration - 3.5 &&
        !playingFullMusic &&
        hasStreamSupport &&
        !isLoadingFullSong &&
        canLoadFullSong
      ) {
        setIsLoadingFullSong(true)
        if (threadInUse === 'main') {
          preLoadCompleteSong()
        } else if (threadInUse === 'worker') {
          console.log('worker')
          // this.audioWorker.postMessage({ type: 'preload', data: { playingFullMusic, all: true } })
        }
      } else {
        console.log(audioCurrentTime, currentDuration, audioCurrentTime >= currentDuration)
        if (playingFullMusic && audioCurrentTime >= currentDuration - 1.5 && !isLoadingFullSong) {
          nextSong()
        }
      }
    }
  }

  useEffect(() => {
    if (initialized) {
      loadSong(tracks[1].url)
    }
  }, [initialized])

  useEffect(() => {
    /**
     * the used buffer to play the song will be
     * `currentSource.buffer` that is being updated by memory reference.
     *
     * We are only using `currentBuffer` state to know when the buffer of
     * `currentShource.buffer` is available.
     */
    if (initialized && currentBuffer) {
      playSong()
    }
  }, [currentBuffer])

  useEffect(() => {
    let ticker: any = null

    if (playing) {
      ticker = setInterval(() => {
        timeHandler()
        songContextHandler()
      }, 300)
    }

    return () => {
      if (ticker) {
        clearInterval(ticker)
      }
    }
  }, [playing])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('react_player--initialize', initialize)
      window.addEventListener('react_player--next_song', nextSong)
      window.addEventListener('react_player--previous_song', prevSong)
      window.addEventListener('react_player--suspend_song', suspendSong)
      window.addEventListener('react_player--resume_song', resumeSong)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('react_player--initialize', initialize)
        window.removeEventListener('react_player--next_song', nextSong)
        window.removeEventListener('react_player--previous_song', prevSong)
        window.removeEventListener('react_player--suspend_song', suspendSong)
        window.removeEventListener('react_player--resume_song', resumeSong)
      }
    }
  }, [audioContext])

  return <Player />
}

export default memo(Controller)
