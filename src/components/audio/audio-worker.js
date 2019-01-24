onmessage = function(data) {
  console.log('worker data:', data)
  postMessage('success')
}