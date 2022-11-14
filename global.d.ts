declare module "*.mp3" {
  const value: any;
  export default value;
}

interface Window {
  webkitAudioContext: typeof AudioContext
}
