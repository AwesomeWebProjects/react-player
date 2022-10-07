import { memo, useState } from "react";
import type { Player } from './PlayerTypes'
import { useAppGlobalState } from '../../contexts/AppContext'
import classNames from "classnames";
import styles from "./styles.module.css";

const tracks = [
				{
					name: 'Small Piece of music LND',
					artist: 'League of Legends',
					url: "/assets/music/short-legends-never-die.mp3"
				},
				{
					name: 'Legends Never Die',
					artist: 'League of Legends',
					url: "/assets/music/legends-never-die.mp3"
				},
				{
					name: 'Rise',
					artist: 'League of Legends',
					url: "/assets/music/rise.mp3"
				},
				{
					name: 'Fantastic - Cinematic Sound',
					artist: 'AudioJungle',
					url: "/assets/music/fantastic.mp3"
				},
			]

const Player = ({ className, ...rest }: Player) => {
  const { state, setFramerLoadingAngle } = useAppGlobalState()

  const initialize = () => {
    // const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext()
    const audioContextCreatedTime = new Date()

  }

  // framer
  const framerSetLoadingPercent = (percent: any) => {
    setFramerLoadingAngle(percent * 2 * Math.PI)
  }


  return (
  <div className={styles['player']}>
		<audio controls>
			<source src={tracks[0].url} type="audio/mpeg" />
			<source src={tracks[1].url} type="audio/mpeg" />
			Your browser does not support the audio element.
		</audio>
  </div>
)};

export default memo(Player);
