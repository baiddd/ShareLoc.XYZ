/**
 * Copyright 2016-2017 Felix Woitzel. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

self.onmessage = function(e) {
    try {
      console.log('rendering worker is running...')
      var data = e.data
      var options = data.options
      var canvas_data = data.canvas_img_data.data;  // the array of RGBA values
      var xx = options.tableDict.x
      var yy = options.tableDict.y
      var ff = options.tableDict.frame
      var rows = options.rows
      var xy_range = options.xy_range
      var width = options.histogram_width
      var height = options.histogram_height
      var table_dict = options.tableDict
      var pixel_size = options.pixel_size
      var isFiltered = options.isFiltered
      var transferables = []
      for(let k in options.tableDict){
        transferables.push(options.tableDict[k].buffer)
      }
      if(isFiltered){
        transferables.push(isFiltered.buffer)
      }
      var min_max_offset = (options.offset_mode == "zero-max")
      if(min_max_offset){
        xy_range[2] = 0;
        xy_range[0] = 0;
      }
      var i = canvas_data.length
      while(i--){
        if(i%4 == 3){
          canvas_data[i] = 255
        }
        else {
          canvas_data[i] = 0
        }
      }
      var progress = 0

      for (var line = 0; line < rows; line++) {
          var newProgress = Math.floor(100 * line / (rows+0.5));
          if(newProgress != progress){
              progress = newProgress
              self.postMessage({progress:progress});
          }
          if(isFiltered && !isFiltered[line]) continue
          var f = ff ? parseInt(ff[line]): line
          var x = parseInt(xx[line]/pixel_size)
          var y = parseInt(yy[line]/pixel_size)
          if(isNaN(f) || isNaN(x) || isNaN(y) ){
            continue
          }
          var s;
          if(y-xy_range[2]>=height || x-xy_range[0]>=width) continue
          s = 4 * (y-xy_range[2]) * width + 4 * (x-xy_range[0]);  // calculate the index in the array

          if(isNaN(canvas_data[s] )){
            continue
          }
          // if(!canvas_data[s]){
          //   canvas_data[s] = 0
          // }
          var v = canvas_data[s]+1
          if(v<=255){
            canvas_data[s] = v
            canvas_data[s+1] = v
            canvas_data[s+2] = v
            canvas_data[s+3] = 255
          }
      }

      self.postMessage({finished: true, canvas_img_data: data.canvas_img_data, _options: options}, transferables);
    } catch (e) {
      console.error(e)
      self.postMessage({error: e, message: 'something went wrong during rendering.', _options:options}, transferables);
    }
}
