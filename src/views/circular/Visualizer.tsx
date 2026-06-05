import { forwardRef } from 'react';
import styles from './Visualizer.module.css';

export const Visualizer = forwardRef<HTMLCanvasElement>(
  function Visualizer(_props, ref) {
    return <canvas ref={ref} className={styles.canvas} />;
  },
);
