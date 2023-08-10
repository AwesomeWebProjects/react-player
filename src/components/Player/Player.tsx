import { memo, useEffect, useState } from 'react'
import classNames from 'classnames'
import type { Player } from './PlayerTypes'
import { AppGlobalStateProvider } from '../../contexts/AppContext'
import styles from './styles.module.css'

const Player = ({ className, ...rest }: Player) => {
  return (
    <div className={styles['player']}>
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('initialize'))
        }}
      >
        Play
      </button>
    </div>
  )
}

export default memo(Player)
