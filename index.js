const EventEmitter = require('events')
const WebSocket = require('ws')

/**
 * auto reconnect websocket wrapper
 * @constructor { url, protocol, webSocket, reconnectInterval, autoConnect }
 * @return {EventEmitter}
 */
class ReconnectWS extends EventEmitter {
  constructor({
    url,
    protocol = [],
    webSocket = WebSocket,
    reconnectInterval = 4000,
    autoConnect = true,
    maxRetries = Infinity
  } = {}) {
    super()
    this.url = url
    this.protocol = protocol
    this.webSocket = webSocket
    this.reconnectInterval = reconnectInterval
    this.maxRetries = maxRetries
    this.retries = 0
    autoConnect && this.connect()
  }
  /**
   * ws connnection handler
   */
  connect() {
    if (this.retries++ >= this.maxRetries) {
      this.emit('maxRetries', this.maxRetries)
      return console.log(`Too many failed connection attempts, ${this.maxRetries}`)
    }
    try {
      this.ws = new this.webSocket(this.url, this.protocol) // eslint-disable-line new-cap
    } catch (err) {
      setTimeout(() => this.connect(), this.reconnectInterval)
      return this.emit('close', err)
    }
    this.ws.on('open', info => {
      this.retries = 0
      console.log(`socket open`)
      this.emit('open', info)
    })
    this.ws.on('message', data => this.emit('message', data))
    this.ws.on('error', err => this.emit('error', err))
    this.ws.on('close', err => {
      console.log('socket close')
      setTimeout(() => this.connect(), this.reconnectInterval)
      return this.emit('close', err)
    })
  }
  /**
   * proxy of websocket.send()
   * @param {String} data
   */
  send(data) {
    try {
      this.ws.send(data)
    } catch (err) {
      this.emit('error', err)
    }
  }
  /**
   * exposed to change proto of websocket instance
   * @param {String} key
   * @param {String} value
   */
  set(key, value) {
    this.ws[key] = value
  }
}

module.exports = ReconnectWS
