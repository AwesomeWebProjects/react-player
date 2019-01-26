onmessage = function(event) {
  const { type, data } = event.data
  console.log('worker data:', { type, data })
  let response = null

  switch (type) {
    case 'audio':
        response = data
      break

    default:
      break
  }

  postMessage(response)
}