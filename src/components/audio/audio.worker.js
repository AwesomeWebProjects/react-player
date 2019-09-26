let audioStreamData = {}
let playingFullMusic = false

const readAudioStream = (response, contentLength, params) => {
  const total = parseInt(contentLength, 10)
  let loaded = 0
  const startedStream = new Date()

  const stream = new ReadableStream({
    start(controller) {
      const reader = response.body.getReader()
      const read = () => {
        reader.read().then(({ done, value }) => {

          if (!params.all) {
            if (params.amount) {
              if (params.amount < total && loaded >= params.amount) {
                // console.log(`Worker: Close stream frag - amount`)
                reader.releaseLock()
                controller.close()
                return
              } else if (loaded >= (65536 * 5)) { // 327.680
                // console.log(`Worker: Close stream frag - amount`)
                reader.releaseLock()
                controller.close()
                return
              }
            } else {
              if (((new Date() - startedStream) / 1000) >= (params.sec || 5)) {
                // console.log(`Worker: Close stream frag - time`)
                reader.releaseLock()
                controller.close()
                return
              }
            }
          }
          if (done) {
            // console.log(`Worker: Close stream done`)
            playingFullMusic = true
            reader.releaseLock()
            controller.close()
            return
          }

          loaded += value.byteLength
          // console.log('Worker: ', { loaded, total, percent: `${((loaded * 100) / total).toFixed(2)}%` }, (new Date() - startedStream) / 1000)
          controller.enqueue(value)

          read()
        }).catch(error => {
          console.error(error)
          controller.error(error)
        })
      }

      read()
    }
  })

  return stream
}

const fetchSong = (url, all = false) => {
  fetch(url).then(response => {
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

    audioStreamData = { response: response.clone(), contentLength: response.headers.get('content-length') }

    const stream = readAudioStream(response, contentLength, { all, sec: 3, amount: 1245184 })
    return new Response(stream)
  })
  .then(response => {
    return response.arrayBuffer()
  })
  .then(response => {
    // console.log('Worker: ', response)

    postMessage({ text: 'worker response ', response, actionType: 'load', playingFullMusic })
  })
}

const preloadSong = () => {
  new Promise((resolve) => {
    // this.setState({ audioStreamData: { response: audioStreamData.response.clone(), contentLength: audioStreamData.response.headers.get('content-length') } })
    // console.log('worker stream data: ', audioStreamData)
    const stream = readAudioStream(audioStreamData.response, audioStreamData.contentLength, { all: true, sec: 1, amount: 1050478 })
    resolve(new Response(stream))
  }).then(response => {
    return response.arrayBuffer()
  }).then(response => {
    // console.log('Worker: ', response)

    postMessage({ text: 'worker response ', response, actionType: 'preload', playingFullMusic })
  })
}

onmessage = function(event) {
  const { type, data } = event.data
  // console.log('worker data:', { type, data })
  playingFullMusic = data.playingFullMusic

  switch (type) {
    case 'audio':
        fetchSong(data.url, data.all)
      break

    case 'preload':
        preloadSong()
      break

    default:
      break
  }
}