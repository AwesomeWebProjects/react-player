onmessage = function(event) {
  const { type, data } = event.data
  console.log('worker data:', { type, data })
  postMessage('success')
}