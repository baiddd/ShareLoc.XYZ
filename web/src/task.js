import { colourGenerator, animalGenerator } from './utils.js'

export class Task {
  constructor(name) {
      this.id = this.randId()
      this.name = name || this.generateName()
      this.frame_range = [0, Infinity]
      this.xy_range = [0, 2560]
      this.pixel_range = [0, 255]
      this.pixel_size = 20
      this.rendered = false
      this.max_frame = Infinity
      this.localization_number = 0
      this.max_localization_number = 0
      this.frame_number = 0
      this.max_frame_number = 0
      this.use_lut = true
      this.histogram_output_png = null
      this.histogram_input_png = null
      this.export_histogram_output_png = null
      this.export_histogram_input_png = null
      this.histogram_input_raw_png = null
      this.pixel_max = 10
      this.input_brightness = 100
      this.output_brightness = 1
      this.max_brightness = 255
      this.csv_file_name = null

  }
  generateName() {
      return colourGenerator() + '-' + animalGenerator()
  }
  randId() {
      return Math.random().toString(36).substr(2, 10)
  }
  start() {

  }
  stop() {

  }
  get_config() {
    return {}
  }

}
