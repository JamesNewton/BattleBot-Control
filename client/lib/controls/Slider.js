import Control from './Control'
import { constrain } from '../utils'

/**
 * Slider for uni-dimensional control.
 *
 * Sliders can be oriented either vertically or horizontally by setting
 * the {@link Slider#type} property. The slider is defined by a reference
 * position, length and radius.
 *
 * ## Vertical Slider ##
 * For vertical sliders, the position is the center of the top half-circle.
 *
 * ```javascript
 * // not actually needed, this is the default mode
 * mySlider.type = Slider.VERTICAL;
 * mySlider.position.x = 20;
 * mySlider.position.y = 20;
 * mySlider.length = 60;
 * mySlider.radius = 10;
 * ```
 *
 * ## Horizonal Slider ##
 * For horizontal sliders, the position is the center of the left half-circle.
 *
 * ```javascript
 * mySlider.type = Slider.HORIZONTAL;
 * mySlider.position.x = 20;
 * mySlider.position.y = 20;
 * mySlider.length = 60;
 * mySlider.radius = 10;
 * ```
 */
export default class Slider extends Control {
  /**
   * Constructor. Create a new Slider and add it to the canvas.
   *
   * @override
   * @param {!string} name - the slider name
   * @throws {Error} control already exists with specified name
   */
  constructor (name) {
    super(name)
    /**
     * The placement of the Slider on the canvas. For a HORIZONTAL Slider,
     * this is the center of the left half-circle, for a VERTICAL Slider, this
     * is the center of top half-circle.
     *
     * For dimension values, see {@link ControlManager.convertToPixels}.
     *
     * @example <caption>Set individually</caption>
     * mySlider.position.x = 10;
     * mySlider.position.y = 20;
     *
     * @example <caption>Set as an Object literal</caption>
     * mySlider.position = { x: 10, y: 20 };
     *
     * @type {Position}
     */
    this.position = { x: 0, y: 0 }
    /**
     * The radius of the Slider arcs.
     *
     * @example
     * mySlider.radius = 10;
     *
     * @type {number}
     */
    this.radius = 10
    /**
     * The length of the Slider. This is the distance between the centers
     * of the two half-circles. It will be measured either vertically or
     * horizontally based on the type of slider.
     *
     * @example
     * mySlider.length = 60;
     *
     * @type {number}
     */
    this.length = 30
    /**
     * The type of slider. This must be equal to one of two constants, either
     * `Slider.VERTICAL` or `Slider.HORIZONTAL`. These values are just strings
     * of value 'Vertical' and 'Horizontal', respectively.
     *
     * @example
     * mySlider.type = Slider.HORIZONTAL;
     *
     * @type {string}
     */
    this.type = Slider.VERTICAL
    /**
     * Should the slider remember its position when it is not being touched.
     * Normally, this is the behavior you want for something like spinning-weapon
     * power.
     *
     * Defaults to `true`.
     *
     * @type {boolean}
     */
    this.sticky = true
    /**
     * Style to draw.
     * @type {string}
     */
    this.style = 'white'
    // initial value //
    this.value = 0
  }

  /**
   * Get Slider dimensions.
   *
   * @protected
   * @return {Map<string,number|string>} named dimension collection, in raw form
   * @property {!(number|string)} x - the x coordinate of origin
   * @property {!(number|string)} y - the y coordinate of origin
   * @property {!(number|string)} r - the radius
   */
  getDimensions () {
    return {
      x: this.position.x,
      y: this.position.y,
      r: this.radius,
      l: this.length
    }
  }

  /**
   * Helper method to return various pixel coordinates useful for both
   * touch match detection and drawing. Values are in pixels.
   *
   * @private
   * @return {Map<string,number|string>} named extended dimension collection, in pixels
   * @property {!(number|string)} x - the x coordinate of origin arc
   * @property {!(number|string)} x1 - left-most x coordinate rectangle
   * @property {!(number|string)} x2 - right-most x coordinate rectangle
   * @property {!(number|string)} xa - the x coordinate of the other arc
   * @property {!(number|string)} y - the y coordinate of origin
   * @property {!(number|string)} y1 - top-most y coordindate of rectangle
   * @property {!(number|string)} y1 - bottom-most y coordindate of rectangle
   * @property {!(number|string)} ya - the y coordinate of the other arc
   * @property {!(number|string)} r - the radius
   * @property {!{number|string}} l - the length
   */
  getHelperDimensions () {
    const { x, y, r, l } = this.getPixelDimensions()
    if (this.type === Slider.HORIZONTAL) {
      return {
        x,
        x1: x,
        x2: x + l,
        xa: x + l,
        y,
        y1: y - r,
        y2: y + r,
        ya: y,
        r,
        l
      }
    } else {
      return {
        x,
        x1: x - r,
        x2: x + r,
        xa: x,
        y,
        y1: y,
        y2: y + l,
        ya: y + l,
        r,
        l
      }
    }
  }

  /**
   * Is the specified touch inside the Slider.
   *
   * This method is called by the framework, so need not be used directly.
   *
   * @override
   * @protected
   * @param {!TouchEvent} touch - the TouchEvent to test
   * @return {boolean} - true if the control matches the event
   */
  matchesTouch (touch) {
    const { clientX, clientY } = touch
    const { x, y, r, x1, y1, x2, y2, xa, ya } = this.getHelperDimensions()

    // check if in the end circles //
    const dx = (x - clientX)
    const dy = (y - clientY)
    if (Math.sqrt(dx * dx + dy * dy) <= r) return true
    const dxa = (xa - clientX)
    const dya = (ya - clientY)
    if (Math.sqrt(dxa * dxa + dya * dya) <= r) return true

    // check if in the rectangle //
    return (clientX >= x1) && (clientX <= x2) && (clientY >= y1) && (clientY <= y2)
  }

  /**
   * A touch tracked by this Slider has been updated. Updates the slider
   * value.
   *
   * This method is called by the framework, so need not be used directly.
   *
   * @override
   * @protected
   * @param {?TouchEvent} touch - the TouchEvent to test
   */
  setTouch (touch) {
    super.setTouch(touch)
    if (touch) {
      const { l, xa, ya } = this.getHelperDimensions()
      if (this.type === Slider.HORIZONTAL) {
        this.value = constrain((xa - touch.clientX) / l, 0.0, 1.0)
      } else {
        this.value = constrain((ya - touch.clientY) / l, 0.0, 1.0)
      }
    } else if (!this.sticky) {
      this.value = 0
    }
  }

  /**
   * Draw the Slider on the canvas.
   *
   * This method is called by the framework, so need not be used directly.
   *
   * @protected
   * @param {!CanvasRenderingContext2D} ctx - the 2D drawing context
   */
  draw (ctx) {
    const { x, y, r, l, x1, y1, x2, y2, xa, ya } = this.getHelperDimensions()

    ctx.beginPath()
    ctx.strokeStyle = this.style
    ctx.lineWidth = 2
    if (this.type === Slider.HORIZONTAL) {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y1)
      ctx.arc(xa, ya, r, Math.PI * 3 / 2, Math.PI / 2, false)
      ctx.moveTo(x2, y2)
      ctx.lineTo(x1, y2)
      ctx.arc(x, y, r, Math.PI / 2, Math.PI * 3 / 2, false)
    } else {
      ctx.arc(x, y, r, Math.PI, Math.PI * 2, false)
      ctx.moveTo(x2, y1)
      ctx.lineTo(x2, y2)
      ctx.arc(xa, ya, r, 0, Math.PI, false)
      ctx.moveTo(x1, y2)
      ctx.lineTo(x1, y1)
    }
    ctx.stroke()

    // paint the current value //
    ctx.beginPath()
    if (this.type === Slider.HORIZONTAL) {
      ctx.arc(xa - (this.value * l), y, r - 4, 0, Math.PI * 2, true)
    } else {
      ctx.arc(x, ya - (this.value * l), r - 4, 0, Math.PI * 2, true)
    }
    ctx.strokeStyle = this.style
    ctx.stroke()

    // paint debug text //
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.fillText(
      `${this.name}, value: ${this.value.toFixed(3)}`,
      xa - 50, ya + r + 15
    )
  }
}
Slider.HORIZONTAL = 'Horizontal'
Slider.VERTICAL = 'Vertical'
