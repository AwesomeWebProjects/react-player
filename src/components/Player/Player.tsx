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
  const { state, setFramerLoadingAngle, setAudioContext, setAudioContextCreatedTime, setAnalyser, setGainNode, setFramerFrequencyData, setBufferLength, setJavascriptNode } = useAppGlobalState()

  const initialize = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext()
    const audioContextCreatedTime = new Date()

    // @TODO: refactor this one to use a not deprecated method
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

    const analyser = audioContext.createAnalyser()
    const gainNode = audioContext.createGain()

    analyser.fftSize = 2048
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // @TODO: refactor this one to use a not deprecated method
    javascriptNode.onaudioprocess = () => {
      analyser.getByteFrequencyData(state.framerFrequencyData) // For Bits
      // analyser.getByteTimeDomainData(state.framerFrequencyData) // For Waves
    }

    setAudioContext(audioContext)
    setAudioContextCreatedTime(audioContextCreatedTime)
    setAnalyser(analyser)
    setGainNode(gainNode)
    setFramerFrequencyData(dataArray)
    setBufferLength(bufferLength)
    setJavascriptNode(javascriptNode)
  }

  // framer
  const framerSetLoadingPercent = (percent: any) => {
    setFramerLoadingAngle(percent * 2 * Math.PI)
  }


  return (
  <div className={styles['player']}>
		<audio controls>
			<source src={tracks[0].url} type="audio/mpeg" />
			Your browser does not support the audio element.
		</audio>
  </div>
)};

export default memo(Player);
