const FFT_SIZE = 2048;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;

  private contextCreatedTime = 0;
  private loadOffsetTime = 0;

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getFrequencyData(): Uint8Array<ArrayBuffer> | null {
    return this.frequencyData;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return Math.max(0, this.audioContext.currentTime - this.loadOffsetTime);
  }

  getDuration(): number {
    return this.currentSource?.buffer?.duration ?? 0;
  }

  getVolume(): number {
    return this.gainNode?.gain.value ?? 0.5;
  }

  isContextSuspended(): boolean {
    return this.audioContext?.state === 'suspended';
  }

  init(initialVolume: number): void {
    if (this.audioContext) return;

    window.AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    this.audioContext = new AudioContext();
    this.contextCreatedTime = Date.now();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = initialVolume;

    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
  }

  updateFrequencyData(): void {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
  }

  async decodeAndPlay(buffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext || !this.analyser || !this.gainNode) {
      throw new Error('AudioEngine not initialized');
    }

    const audioBuffer = await this.audioContext.decodeAudioData(buffer);

    this.disconnectSource();

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    this.currentSource = source;

    this.connectAndStart(source);

    this.loadOffsetTime =
      (Date.now() - this.contextCreatedTime) / 1000;

    if (this.loadOffsetTime > this.audioContext.currentTime) {
      this.loadOffsetTime = this.audioContext.currentTime;
    }
  }

  async decodeAndSwap(buffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext || !this.analyser || !this.gainNode) {
      throw new Error('AudioEngine not initialized');
    }

    const audioBuffer = await this.audioContext.decodeAudioData(buffer);

    const offset = this.audioContext.currentTime - this.loadOffsetTime;

    this.disconnectSource();

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    this.currentSource = source;

    this.connectAndStart(source, offset, offset);
  }

  private connectAndStart(
    source: AudioBufferSourceNode,
    when = 0,
    offset = 0,
  ): void {
    if (!this.analyser || !this.gainNode || !this.audioContext) return;

    source.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    if (when && offset) {
      source.start(when, offset);
    } else {
      source.start(0);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private disconnectSource(): void {
    if (this.currentSource) {
      try {
        this.currentSource.disconnect();
      } catch {
        // already disconnected
      }
      this.currentSource = null;
    }
  }

  suspend(): void {
    this.audioContext?.suspend();
  }

  resume(): void {
    this.audioContext?.resume();
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  dispose(): void {
    this.disconnectSource();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.gainNode = null;
    this.frequencyData = null;
  }
}
