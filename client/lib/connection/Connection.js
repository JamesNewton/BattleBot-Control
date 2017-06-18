/**
 * Base interface for connection to robot.
 *
 * Contains shared functionality between the AJAX and WebSocket connection types.
 *
 * Implements a buffered asynchronous connection. External sources should
 * call setRobotData() whenever new data is available. It will be sent to the robot
 * at the fasted rate the connection will allow.
 *
 * @example <caption>Connection States</caption>
 * Connection.CONNECTED = 'Connected'
 * Connection.CONNECTING = 'Connecting'
 * Connection.DISCONNECTED = 'Disconnected'
 * Connection.ERROR = 'Error'
 */
export default class Connection {
  /**
   * Constructor.
   *
   * @abstract
   * @protected
   */
  constructor () {
    /**
     * The current state of the connection
     * @type {string}
     */
    this.state = Connection.DISCONNECTED
    /**
     * Is connection enabled.
     * @type {boolean}
     */
    this.enabled = false
    /**
     * The last error recorded if the state is ERROR
     * @type {Error}
     */
    this.lastError = null
    /**
     * The round-trip time for the last packet received
     * @type {number}
     */
    this.pingTimeMs = null
    /**
     * StateChange event, raised whenever the connection state changes.
     *
     * @emits {StateChangeEvent} the state connection state has changed
     * @type {function(newState: string, oldState: string)}
     */
    this.onstatechange = null
    /**
     * ResponseData event, raised when the connection has received new data
     * from the robot. The data is a raw string as generated by the robot
     * firmware.
     *
     * @emits {ResponseDataEvent} new data received
     * @type {function(data: string)}
     */
    this.onresponsedata = null
    /**
     * @private
     * @type {string}
     */
    this.responseData = null
    /**
     * @private
     * @type {string}
     */
    this.dataPacket = null
  }

  /**
   *  Start connection to the robot.
   */
  start () {
    this.enabled = true
  }

  /**
   *  Stop connection to the robot.
   */
  stop () {
    this.enabled = false
  }

  /**
   * Update the connection state and notify listeners if the state
   * has changed.
   *
   * @private
   * @param {string} newState - the new state
   */
  setState (newState) {
    if (newState === this.state) return
    const oldState = this.state
    this.state = newState

    // notify listener //
    if (typeof this.onstatechange === 'function') {
      this.onstatechange(newState, oldState)
    }
  }

  /**
   * Set the raw data packet to send to the robot. The actual connection
   * operates asynchronously, so this method should be called as frequently
   * as new data is available.
   *
   * If an object is passed, it will be converted to JSON.
   *
   * @protected
   * @param {object|string} data the data packet to send
   */
  setRobotData (data) {
    this.dataPacket = (typeof data === 'string') ? data : JSON.stringify(data)
  }

  /**
   * Get the latest raw data packet received from the robot. This is set
   * asynchronously by the connection.
   *
   * @protected
   * @return {string} last robot data packet
   */
  getResponseData () {
    return this.responseData
  }

  /**
   * Called by connections to set the latest response data and update
   * any listeners.
   *
   * @private
   * @param {string} data the data packet received
   */
  setResponseData (data) {
    this.responseData = data
    if (!data) {
      this.pingTimeMs = null
    }
    // notify listener //
    if (typeof this.onresponsedata === 'function') {
      this.onresponsedata(data)
    }
  }
}
// connection status constants //
Connection.CONNECTED = 'Connected'
Connection.CONNECTING = 'Connecting'
Connection.DISCONNECTED = 'Disconnected'
Connection.ERROR = 'Error'
