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

 function parseFile(file, reading_callback, finish_callback) {
     var fileSize   = file.size;
     var chunkSize  = 104857600; //100 mega bytes
     var offset     = 0;
     var self       = this; // we need a reference to the current object
     var chunkReaderBlock = null;
     if(!file){
       finish_callback(false)
       return
     }
     var readEventHandler = function(evt) {
         if (evt.target.error == null) {
             offset += evt.target.result.length;
             reading_callback(evt.target.result); // callback for handling read chunk
         } else {
             console.log("Read error: " + evt.target.error);
             finish_callback(false);
             return;
         }
         if (offset >= fileSize) {
             finish_callback(true);
             console.log("Done reading file");
             return;
         }
         // of to the next chunk
         chunkReaderBlock(offset, chunkSize, file);
     }
     chunkReaderBlock = function(_offset, length, _file) {
         var r = new FileReader();
         var blob = _file.slice(_offset, length + _offset);
         r.onload = readEventHandler;
         r.onerror = function () {finish_callback(false)}
         r.readAsText(blob);
     }
     // now let's start the read with the first block
     chunkReaderBlock(offset, chunkSize, file);
 }

self.onmessage = function(e) {
    var format = e.data.format

    try {
      console.assert(format.type == 'table')
      console.assert(format.mode == 'text')
      console.assert(format.delimiter)
    } catch (e) {
      console.error(e)
      self.postMessage({error: 'format error'});
      return
    }

    var delimiter = format.delimiter
    var headers = [];
    var escapedHeaders = [];
    var transformedHeaders = [];
    var reader = new FileReader();


    var table_data = {};
    var arrayBuffersList = []
    var statshtml = "";
    var leftover_str = null;
    var min = []; max = []; avg = [];
    var rows = 0;
    var localization_num = 0;
    var before = Date.now();
    var file = e.data.file;
    var totalBytes = file.size;
    var bytesRead = 0;
    table_data.file_name = file.name
    table_data.file_size = file.size
    table_data.file_type = file.type
    // table_data.arrayBuffersList = arrayBuffersList;
    // table_data.file = e.data.file;
    var isFirstBlock = true;


    var reading_callback = function (result) {
        var arrayBuffers = [];
        var float32Arrays = [];
        if(leftover_str){
          result = leftover_str + result;
        }
        var lines = result.split('\n');
        if(isFirstBlock){
          if(format.header_row>=0){
            headers = lines[0].split(delimiter)
            table_data.header_line = lines[0];
            lines.shift();
          }
          else{
            table_data.header_line = null
            const num = lines[0].split(delimiter).length
            headers = []
            for(var header = 0; header < num; header++){
              headers.push(header.toString())
            }
          }

          for(var header = 0; header < headers.length; header++){
              var escapedTitle = headers[header].toString().replace(/'/g,'').replace(/"/g,'');
              escapedHeaders[header] = escapedTitle;
              if(format.header_transform[escapedTitle]){
                transformedHeaders[header] = format.header_transform[escapedTitle].replace(/[^a-zA-Z0-9]+/g,'_').trim()
              }
              else{
                transformedHeaders[header] = escapedTitle.replace(/[^a-zA-Z0-9]+/g,'_').trim()
              }
              if(transformedHeaders[header] .startsWith('_')){
                transformedHeaders[header]  = transformedHeaders[header].slice(1)
              }
              min[header] = Number.POSITIVE_INFINITY;
              max[header] = Number.NEGATIVE_INFINITY;
              avg[header] = 0;
          }

          table_data.headers_original = escapedHeaders;
          isFirstBlock = false;
          table_data.headers = transformedHeaders;
          if(transformedHeaders.indexOf('x')<0 || !transformedHeaders.indexOf('y')<0){
            self.postMessage({error: 'wrong file format'});
            return
          }
        }
        var endsWithNewLine = (lines[lines.length - 1] != "");
        var lineNum = lines.length - (endsWithNewLine ? 1 : 0);

        if(endsWithNewLine){
          leftover_str = lines[lines.length -1];
        }
        else{
          leftover_str = null;
        }
        for(var header = 0; header < headers.length; header++){
            arrayBuffers[header] = new ArrayBuffer(lineNum*4);
            float32Arrays[header] = new Float32Array(arrayBuffers[header]);
        }
        var skipped = 0
        for (var line = 0; line < lineNum; line++) {
            localization_num += 1;
            bytesRead += lines[line].length
            if(localization_num%100000 == 0){
                self.postMessage({progress: bytesRead/totalBytes*100, localization_num: localization_num});
            }
            val = lines[line].split(delimiter);
            if(lines[line] == '' || headers.length != val.length){
              skipped++
              continue
            }
            for(var header = 0; header < headers.length; header++){
                var v = Number(val[header]);
                if(min[header] > v){
                    min[header] = v;
                }
                if(max[header] < v){
                    max[header] = v;
                }
                if(avg[header] == undefined){
                    avg[header] = 0;
                }
                avg[header] += v;
                float32Arrays[header][line-skipped] = v;
            }
        }
        if(skipped) console.log('skipped ' + skipped + ' lines.')
        for(var header = 0; header < headers.length; header++){
            arrayBuffers[header] = arrayBuffers[header].slice(0, arrayBuffers[header].byteLength-skipped*4)
            float32Arrays[header] = float32Arrays[header].slice(0, float32Arrays[header].length-skipped)
        }
        rows += (lineNum - skipped);
        arrayBuffersList.push(arrayBuffers)
    };

    var finish_callback = function(sucess){
      if(!sucess){
        console.log('finished with error')
        self.postMessage({error: 'loading error'});
        return
      }
      isFirstBlock = true
      var float32Arrays = [];
      var tableUint8Arrays = []
      var dd = new Float32Array(arrayBuffersList[0][1]);
      for(var header = 0; header < headers.length; header++){
        var arrayUint8 = new Uint8Array(rows*4);
        var offset = 0;
        for(var i=0;i<arrayBuffersList.length;i++){
           arrayUint8.set(new Uint8Array(arrayBuffersList[i][header]), offset);
           offset += arrayBuffersList[i][header].byteLength
        }
        tableUint8Arrays[header] = new Uint8Array(arrayUint8.buffer);
        float32Arrays[header] = new Float32Array(arrayUint8.buffer);
      }
      table_data.tableArrays = float32Arrays;
      table_data.tableUint8Arrays = tableUint8Arrays;
      statshtml = rows + " samples loaded; ";
      for(var header = 0; header < transformedHeaders.length; header++){
          avg[header] = avg[header]/rows
          statshtml += transformedHeaders[header] + ": "
              + min[header] + " - " + max[header] + " ("
              + Math.round(avg[header]*10)/10 + "), ";
      }
      statshtml += "parsing time [ms]: " + (Date.now() - before);
      table_data.statshtml = statshtml
      table_data.rows = rows
      table_data.columns = float32Arrays.length

      table_data.min = {}
      table_data.max = {}
      table_data.avg = {}
      table_data.tableDict = {}
      table_data.tableUint8Dict = {}
      var transferables = []
      for(let i=0;i<transformedHeaders.length;i++){
        table_data.min[transformedHeaders[i]] = min[i]
        table_data.max[transformedHeaders[i]] = max[i]
        table_data.avg[transformedHeaders[i]] = avg[i]
        table_data.tableDict[transformedHeaders[i]] = float32Arrays[i]
        transferables.push(float32Arrays[i].buffer)
        table_data.tableUint8Dict[transformedHeaders[i]] = tableUint8Arrays[i]
      }
      table_data.loaded = true
      self.postMessage(table_data, transferables);
    }
    parseFile(e.data.file, reading_callback, finish_callback)
}
