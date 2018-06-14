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

onmessage = function(e) {
    var arrayBuffers = [];
    var float32Arrays = [];
    var titles = [];
    var reader = new FileReader();
    var delimiter = e.data.delimiter || ',';
    reader.onload = function (progressEvent) {
        var before = Date.now();
        var lines = this.result.split('\n');
        var endsWithNewLine = (lines[lines.length - 1] != "");
        var numLines = lines.length - (endsWithNewLine ? 2 : 1);
        var bufferLength = e.data.bufferLength ? e.data.bufferLength : (512 * 512); // defaulting to 2M
        var numChunks = Math.ceil(numLines/bufferLength);
        var statshtml = numLines + " samples loaded";
        titles = lines[0].split(delimiter);
        var min = []; max = []; avg = [];
        for(var title = 0; title < titles.length; title++){
            min[title] = Number.POSITIVE_INFINITY;
            max[title] = Number.NEGATIVE_INFINITY;
            avg[title] = 0;
            arrayBuffers[title] = new ArrayBuffer(numLines*4);
            float32Arrays[title] = new Float32Array(arrayBuffers[title]);
        }
        var progress = 0;
        for (var line = 1; line < numLines; line++) {
            var newProgress = Math.floor(100 * line / (lines.length+1));
            if(newProgress != progress){
                progress = newProgress;
                postMessage({progress: progress});
            }
            val = lines[line].split(delimiter);
            for(var title = 0; title < titles.length; title++){
                var v = Number(val[title]);
                if(min[title] > v){
                    min[title] = v;
                }
                if(max[title] < v){
                    max[title] = v;
                }
                if(avg[title] == undefined){
                    avg[title] = 0;
                }
                avg[title] += v /(lines.length-1);
                float32Arrays[title][line-1] = v;
            }
        }
        var escapedTitles = [];
        for(var title = 0; title < titles.length; title++){
            var escapedTitle = titles[title].replace(/"/g,'').trim();
            escapedTitles.push(escapedTitle);
            statshtml += escapedTitle + ": "
                + min[title] + " - " + max[title] + " ("
                + Math.round(avg[title]*10)/10 + "), ";
        }
        statshtml += "parsing time [ms]: " + (Date.now() - before);
        postMessage({
                statshtml: statshtml,
                stats: {min: min, max: max, avg: avg},
                titles: escapedTitles,
                numLines: numLines,
                numChunks: numChunks,
                arrayBuffers: arrayBuffers,
                bufferLength: bufferLength,
                float32Arrays: float32Arrays,
                file: e.data.file
            }, arrayBuffers);
    };
    reader.readAsText(e.data.file);
}
