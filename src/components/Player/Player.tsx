import { memo, useEffect, useState } from 'react'
import type { Player } from './PlayerTypes'
import { useAppGlobalState } from '../../contexts/AppContext'
import classNames from 'classnames'
import styles from './styles.module.css'

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

const Player = ({ className, ...rest }: Player) => {
  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()

    const currentSource = audioContext.createBufferSource()

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

      const audioStreamData = {
        response: response.clone(),
        contentLength: response.headers.get('content-length'),
      }

      console.log(audioStreamData)
    }

    loadSong(tracks[1].url)
  }

  return <div className={styles['player']}></div>
}

export default memo(Player)
