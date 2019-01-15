<template>
  <div class="viewer">
    <div class="md-title">{{title}}</div>
      <!-- <md-card >
        <md-card-content > -->
          <md-app v-show="options">
            <md-app-toolbar class="md-transparent md-dense" md-elevation="0" v-if="!menuVisible || (options && options.tableDict && show_filter)||(selected_filter!== null && selected_filter_max!== null && selected_filter_min!== null)">
              <div class="md-toolbar-row"  flex>
                <md-button class="md-fab md-primary" @click="menuVisible=true" v-if="!menuVisible && options">
                  <md-icon>menu</md-icon>
                </md-button>
                <div class="md-layout md-xsmall-hide" v-if="options">
                    <md-switch v-show="rendered && options && options.tableDict && options.tableDict.z" v-model="use_3d" :disabled="!options || !options.tableDict || (!options.tableDict.z && !use_3d)" @change="switch3DView(use_3d)" name="use LUT">3D View</md-switch>&nbsp;&nbsp;
                </div>

                <div class="md-toolbar-section-start slider-toolbar" v-if="filter_enabled && rendered && selected_filter!== null && selected_filter_max!== null && selected_filter_min!== null">
                  <div class="md-layout-item"  flex>
                    <span class="md-xsmall-hide" >Set range for</span> <md-chip>{{selected_filter}}</md-chip> {{(filter_ranges[selected_filter][1]-filter_ranges[selected_filter][0]).toFixed(1)}}, {{filter_ranges[selected_filter]}}
                    <div>
                    <vue-slider ref="filter-slider"  @drag-end="update_selected_filter()" :disabled="rendering" tooltip-dir="bottom" :max="selected_filter_max" :min="selected_filter_min" v-model="filter_ranges[selected_filter]"></vue-slider>
                    <md-tooltip> Adjust filter range for "{{this.selected_filter}}"</md-tooltip>
                    </div>
                  </div>
                </div>

                <!-- <div class="md-layout-item" v-if="show_brightness">
                  <vue-slider @drag-end="updateCanvas()" :disabled="rendering" tooltip-dir="bottom" :max="255" :min="1" v-model="current_render2d_config.brightness"></vue-slider>
                  <md-tooltip> Adjust brightness </md-tooltip>
                </div> -->

                <div class="md-toolbar-section-start" v-if="options && options.tableDict && show_filter" flex>
                  <md-button  v-show="rendered && show_filter" class="md-accent md-icon-button" :disabled="rendering"  @click="plotHist()">
                    <md-icon>refresh</md-icon>
                    <md-tooltip> Refresh </md-tooltip>
                  </md-button>

                    <md-field>
                      <label for="filter-id" class="md-xsmall-hide">Filter Expression (e.g. frame>1000 and random()<0.1)</label>
                      <md-input v-model="filter_expression" :disabled="rendering" @keyup.enter.native="plotHist()" type="text">
                      </md-input>
                      <span class="md-helper-text md-xsmall-hide">{{filter_tooltip}}</span>
                      <md-tooltip>{{filter_tooltip}}</md-tooltip>
                    </md-field>
                </div>
                <div class="md-toolbar-section-end md-xsmall-hide" layout="row" v-show="running && !menuVisible && options && screenWidth>800">
                    <p>{{running_status}} {{running_status.length<30? ', please wait, this may take a while.': ''}} </p>
                    <md-progress-bar md-mode="indeterminate" v-show="!(running_progress && running_progress>0)"></md-progress-bar>
                    <md-progress-bar :md-value="running_progress" v-show="running_progress && running_progress>0"></md-progress-bar>
                </div>

              </div>

            </md-app-toolbar>
            <md-app-drawer :md-active.sync="menuVisible" md-persistent="full">

              <div class="md-toolbar-row" v-show="!running" flex>
                  <slot name="actions" :download="downloadSmlmFile">
                    <md-button class="md-fab md-primary" @click="selectFile(true)">
                     <md-icon>add</md-icon>
                     <md-tooltip>Load another file</md-tooltip>
                    </md-button>
                    <md-button class="md-primary" @click="shareFile">
                      <md-icon>share</md-icon>Share
                      <md-tooltip>share this smlm file</md-tooltip>
                    </md-button>
                    <div class="md-toolbar-section-end">
                      <md-button class="md-icon-button md-dense md-raised" @click="menuVisible = !menuVisible">
                        <md-icon>keyboard_arrow_left</md-icon>
                      </md-button>
                    </div>
                  </slot>
              </div>
              <div layout="row" v-if="running">
                <md-divider></md-divider>
                <p>{{running_status}} {{running_status.length<30? ', please wait, this may take a while.': ''}} </p>
                <md-progress-bar md-mode="indeterminate" v-show="!(running_progress && running_progress>0)"></md-progress-bar>
                <md-progress-bar :md-value="running_progress" v-show="running_progress && running_progress>0"></md-progress-bar>
                <br>
              </div>

              <div v-if="smlm">
                <span class="md-list-item-text">Files</span>
                <md-divider></md-divider>
                <md-list v-if="loaded_sample && smlm">
                    <md-list-item @click="showFilesDialog=false;loadS3File(f, h);" v-for="(f, h) in loaded_sample.files" :key="h" :md-expand="smlm&&smlm.manifest.hash == h" :md-expanded.sync="f.expandFiles">
                      {{smlm.manifest.hash == h?'+':''}} <md-chip v-for="tag in f.tags" :key="tag">{{tag}}</md-chip> <span :class="selected_s3_file == h?'files-item-1-selected':'files-item-1'">{{f.name}}</span>
                      <md-list v-if="smlm&&smlm.manifest.hash == h" slot="md-expand">
                          <md-list-item  @click="showFilesDialog=false;loadSmlmFile(sf);" v-for="(sf, i) in smlm.files" :key="sf.hash">
                            <span  :class="selected_smlm_file_hash == sf.hash?'files-item-2-selected':'files-item-2'">&nbsp;&nbsp;-&nbsp;
                              <md-chip v-for="(tag, n) in sf.tags" :key="tag" v-if="n<3">{{tag}}</md-chip>{{sf.name}}
                            </span>
                          </md-list-item>
                      </md-list>
                    </md-list-item>
                </md-list>
                <md-list v-if="!loaded_sample && smlm && smlm.files">
                  <md-list-item @click="showFilesDialog=false;loadSmlmFile(sf);" v-for="(sf, i) in smlm.files" :key="sf.hash">
                    <span :class="selected_smlm_file_hash == sf.hash?'files-item-2-selected':'files-item-2'">&nbsp;-&nbsp;
                      <md-chip v-for="(tag, n) in sf.tags" :key="tag" v-if="n<3">{{tag}}</md-chip>{{sf.name}}
                    </span>
                  </md-list-item>
                </md-list>
              </div>
              <div class="md-layout"  md-vertical-align="end" v-show="false">
                <input class="md-file" type="file" @change="fileSelected" ref="select_file_input"></input>
              </div>

              <!-- <div class="md-toolbar-row" v-if="options && options.tableDict && show_filter" flex>
                <md-divider></md-divider>
                <md-button  v-show="rendered && show_filter" class="md-accent md-icon-button" :disabled="rendering"  @click="plotHist()">
                  <md-icon>refresh</md-icon>
                  <md-tooltip> Refresh </md-tooltip>
                </md-button>
                <div class="md-toolbar-section-start" flex>
                  <md-field>
                    <label for="filter-id">Filter Expression (e.g. frame>1000 and random()<0.1)</label>
                    <md-input v-model="filter_expression" :disabled="rendering" @keyup.enter.native="plotHist()" type="text">
                    </md-input>
                    <span class="md-helper-text">{{filter_tooltip}}</span>
                    <md-tooltip>{{filter_tooltip}}</md-tooltip>
                  </md-field>
                </div>
              </div> -->

              <div v-if="filter_enabled">
                <span class="md-list-item-text">Apply filter</span>
                <md-divider></md-divider>
                <p >click a name to set the value range:</p>
                <div v-if="options && options.headers">
                  <md-chip  v-for="(header, index) in options.headers" :key="index" v-show="options&&options.headers" :class="(selected_filter == header)? 'md-primary': '' " md-clickable @click="show_filter=false; switch_selected_filter(header)">{{header}}
                    <md-tooltip>click to set the range of '{{header}}'</md-tooltip>
                  </md-chip>
                </div>

                <md-button :disabled="rendering" @click="reset_filters()">
                  <md-icon>settings_backup_restore</md-icon>reset filter
                  <md-tooltip> Reset filter </md-tooltip>
                </md-button>
                <md-button  v-show="rendered" @click="show_filter=!show_filter; selected_filter=null">
                  <md-icon>details</md-icon>filter expression
                  <md-tooltip> Show filter expression</md-tooltip>
                </md-button>
                <!-- <div class="md-toolbar-row" v-if="selected_filter!== null && selected_filter_max!== null && selected_filter_min!== null" flex>
                  <div class="md-layout-item">
                    <vue-slider @drag-end="update_selected_filter()" :disabled="rendering" tooltip-dir="bottom" :max="selected_filter_max" :min="selected_filter_min" v-model="filter_ranges[selected_filter]"></vue-slider>
                    <md-tooltip> Adjust filter range for "{{this.selected_filter}}"</md-tooltip>
                  </div>
                </div> -->
                <br>
                <br>
              </div>
              <span class="md-list-item-text">Adjust brightness</span>
              <md-divider></md-divider>
              <div class="md-toolbar-row" flex>
                <div class="md-layout-item">
                  <div>
                  <vue-slider ref="brightness-slider" @drag-end="updateCanvas()" :disabled="rendering" tooltip-dir="bottom" :max="255" :min="1" v-model="current_render2d_config.brightness"></vue-slider>
                  <md-tooltip> Adjust brightness </md-tooltip>
                  </div>
                  <br>
                </div>
              </div>

              <span class="md-list-item-text">More options</span>
              <md-divider></md-divider>

              <md-list slot="md-expand">
                <md-list-item class="md-primary menu-button" >
                  <md-switch  v-model="use_lut" @change="updateCanvas()" name="use LUT"><span class="md-list-item-text">Apply LUT</span></md-switch>
                </md-list-item>
                <md-list-item>
                  <md-field>
                    <label for="pixel_size">Pixel Size (nm)</label>
                    <md-input type="text" @keyup.enter.native="plotHist()" v-model="pixel_size" name="pixel_size"></md-input>
                  </md-field>
                  <md-field>
                    <label for="offset_mode">Offset Mode</label>
                    <md-select v-model="offset_mode" @md-closed="options && options.tableDict && plotHist()" name="offset-mode">
                      <md-option value="min-max" >min-max</md-option>
                      <md-option value="zero-max">zero-max</md-option>
                    </md-select>
                  </md-field>
                </md-list-item>

                <md-list-item v-if="tags">
                    <md-chips v-model="tags" :md-limit="20" md-placeholder="Type a tag and press enter...">
                       <template slot="md-chip" slot-scope="{ chip }">
                         {{ chip }}
                         <!-- <small v-if="chip === currentProject">(Marcos Moura)</small> -->
                       </template>
                       <div class="md-helper-text">please use tags to label this sample. E.g.: microtubule, hela, AF647</div>
                     </md-chips>
                </md-list-item>

                <md-list-item class="md-primary menu-button" @click="showInfoDialog=true">
                  <md-icon>info</md-icon><span class="md-list-item-text">Info</span>
                  <md-tooltip>show info</md-tooltip>
                </md-list-item>
                <md-list-item class="md-primary menu-button" @click="downloadSmlmFile">
                  <md-icon>file_download</md-icon><span class="md-list-item-text">Export</span>
                  <md-tooltip v-if="smlm&&smlm.isSMLM">save as .smlm file</md-tooltip>
                  <md-tooltip v-else>save as a compressed zip file</md-tooltip>
                </md-list-item>
                <md-list-item class="md-primary menu-button" v-show="export_histogram_png" @click="download_image(export_histogram_png, 'exported_input.png')" >
                  <md-icon>save</md-icon><span class="md-list-item-text">Save image</span>
                  <md-tooltip>download and save current image</md-tooltip>
                </md-list-item>
              </md-list>
            </md-app-drawer>

            <md-app-content>

               <!-- <span v-show="options.tableDict && !localizationNumber" class="md-warn md-subheader"> No localization available to show. </span> -->

               <md-progress-bar  v-if="(rendered||rendering) && options && options.tableDict" :md-value="rendering_progress"></md-progress-bar>

               <div class="canvas-container" v-if="options">
                 <div class="md-layout render-info" v-if="(rendered||rendering) && options && options.tableDict">
                   <span>{{rendering_status}} {{rendering_progress>0?rendering_progress+'%':''}} </span><span class="render-info" v-show="use_3d"> &nbsp;&nbsp;fps:{{fps}}, ppf:{{ppf}} </span>
                 </div>

                 <div v-show="rendered && !use_3d" id="leaflet_histogram" ></div>
                 <!-- <canvas v-show="rendered" v-if="!use_3d" id="histogram_canvas" v-bind:width="histogram_width" v-bind:height="histogram_height"></canvas> -->
                 <!-- <canvas v-show="false" v-if="!use_3d" id="histogram_canvas_buffer" v-bind:width="histogram_width" v-bind:height="histogram_height"></canvas> -->

                 <div v-show="use_3d" id="gui-webgl"> </div>
                 <canvas v-show="use_3d" id="histogram_canvas_3d"></canvas>
                </div>

               <!-- <md-empty-state
                v-show="options && !rendered"
                md-icon="devices_other"
                md-label="Load a localization table"
                md-description="Load a table, you'll be able to upload your file, render it, filter it and share with people.">
              </md-empty-state> -->
               <!-- <md-content>
                 <div id="histogram_map"></div>
               </md-content> -->

               <md-empty-state flex
                v-if="!options&&!shared_url_mode"
                md-icon="hourglass_empty"
                md-label="Open a localization table"
                md-description="Render your table in the browser, process and share it with our server.">
                 <div v-if="running">
                  <md-progress-bar md-mode="indeterminate" v-show="!(running_progress && running_progress>0)"></md-progress-bar>
                  <md-progress-bar :md-value="running_progress" v-show="running_progress && running_progress>0"></md-progress-bar>
                  <p>{{running_status}} {{running_status.length<30? ', please wait...': ''}} </p>
                 </div>
                 <md-button class="md-primary md-raised" :disabled="running" @click="selectFile(false)">
                   <md-icon>add</md-icon>Open a file
                 </md-button>
                 <md-button id="repository-button" class="md-primary" :disabled="running" to="/repository">
                   No data? checkout the repository for public data.
                 </md-button>
                 <br>
                 <md-card class="faq-card">
                   <md-card-content>
                     <h2>FAQ</h2>
                     <h3>what are the supported file formats?</h3>
                     <p>Currently, you can load files with the following formats: <a href="https://github.com/imodpasteur/smlm-file-format" target="_blank">SMLM(.smlm)</a>, ThunderSTORM(.csv/.xls), RapidSTROM, ZEISS(ELYRA), .png, .jpg.</p>
                     <p> If you have other file format which is not supported yet, please <a href="https://www.dropbox.com/request/IyZ7HkzHUpB0t5Mkp46l" target="_blank">upload a sample file</a>, and <a href="https://oeway.typeform.com/to/rdkPmd" target="_blank">send us a message</a> to describe your file format, we will try to support your file format. </p>
                     <h3>where does my data go?</h3>
                     <p>Don't worry, your data will stay in your browser, and will not go to our server unless you choose to process it with our server or use the sharing features.
                     If you process your data with our server, by default, no one else could access it, and we won't use it for other purposes without your permission.</p>
                     <md-button class="md-primary" to="/faq">read more</md-button>
                   </md-card-content>
                  </md-card>

               </md-empty-state>
               <md-empty-state flex
                v-if="!options&&shared_url_mode"
                md-icon="hourglass_empty"
                md-label="Loading sample..."
                md-description="Please wait, this may take a while...">
                 <div v-if="running">
                  <md-progress-bar md-mode="indeterminate" v-show="!(running_progress && running_progress>0)"></md-progress-bar>
                  <md-progress-bar :md-value="running_progress" v-show="running_progress && running_progress>0"></md-progress-bar>
                  <p>{{running_status}} {{running_status.length<30? ', please wait...': ''}} </p>
                 </div>
                 <div v-if="loading_shared_url">
                   <md-progress-spinner :md-diameter="100" :md-stroke="10" md-mode="indeterminate"></md-progress-spinner>
                 </div>
               </md-empty-state>
             </md-app-content>
         </md-app>
        <!-- </md-card-content> -->

      <!-- </md-card> -->
      <md-dialog-alert
      :md-active.sync="showErrorDialog"
      :md-content="error_content"
      md-confirm-text="OK" :md-click-outside-to-close="false"/>

      <md-dialog :md-active.sync="showUploading" :md-click-outside-to-close="false">
        <md-dialog-content>
          <div layout="row">
            <p>{{running_status}} {{running_status.length<30? ', please wait, this may take a while.': ''}} </p>
            <md-progress-bar md-mode="indeterminate" v-show="!(running_progress && running_progress>0)"></md-progress-bar>
            <md-progress-bar :md-value="running_progress" v-show="running_progress && running_progress>0"></md-progress-bar>
            <br>
          </div>
        </md-dialog-content>
        <md-dialog-actions>
          <md-button class="md-primary" @click="showUploading=false">Close</md-button>
        </md-dialog-actions>
      </md-dialog>


      <md-dialog :md-active.sync="showImportDialog" :md-click-outside-to-close="false">
        <md-dialog-content>
          <div class="md-layout-row md-gutter">
          <div class="md-flex">
            <md-field v-if="selected_file">
              <label for="file-format">File Format</label>
              <md-select v-model="text_file_format" name="file-format" id="file-format">
                <md-option v-if="selected_file_name.endsWith(format.extension) || selected_file_name.indexOf('.')==-1" :value="key" v-for="(format, key) in supported_file_formats" :key="key">{{key}}</md-option>
              </md-select>
            </md-field>

            <md-field>
              <label for="pixel_size">Pixel Size (nm)</label>
              <md-input type="text" v-model="pixel_size" name="pixel_size"></md-input>
            </md-field>

            <div class="md-flex">
                <label>Tags for this channel/file</label>
                <md-chips v-model="tags" :md-limit="20" md-placeholder="Type a file tag and press enter...">
                   <template slot="md-chip" slot-scope="{ chip }">
                     {{ chip }}
                     <!-- <small v-if="chip === currentProject">(Marcos Moura)</small> -->
                   </template>
                   <div class="md-helper-text">e.g. SR for SuperRes image, WF for widefield</div>
                 </md-chips>
            </div>
            <md-switch v-model="append_mode" v-if="this.smlm" name="append">Append to the current file</md-switch>
            <md-switch v-model="show_more_import_options" name="more_options">more options</md-switch>
            <div v-show="show_more_import_options">
              <label>File content:</label>
              <p v-for="(line, i) in file_sample_lines" :key="i"> {{line}} </p>
              <p>...</p>
              <!-- <md-field>
                <label for="channel_name">Channel Name</label>
                <md-input type="text" v-model="channel_name" name="channel_name"></md-input>
              </md-field> -->
              <!-- <md-field>
                <label for="delimiter"> Delimiter </label>
                <md-input type="text" v-model="delimiter" name="delimiter"></md-input>
              </md-field> -->
              <md-field>
                <label for="offset_mode"> Offset Mode</label>
                <md-select v-model="offset_mode" name="offset-mode">
                  <md-option value="min-max" >min-max</md-option>
                  <md-option value="zero-max" >zero-max</md-option>
                </md-select>
              </md-field>
              <md-field>
                <label for="offset_x">Offset(x)</label>
                <md-input type="text" v-model="offset_x" name="offset_x"></md-input>
              </md-field>
              <md-field>
                <label for="offset_y">Offset(y)</label>
                <md-input type="text" v-model="offset_y" name="offset_y"></md-input>
              </md-field>
            </div>
          </div>
          </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" @click="loadFile(); showImportDialog=false">OK</md-button>
        <md-button class="md-primary" @click="showImportDialog=false">Cancel</md-button>
      </md-dialog-actions>
      </md-dialog>

      <md-dialog :md-active.sync="showInfoDialog">
        <md-dialog-content>
          <div class="md-layout-row md-gutter">
            <div class="md-flex">
                <label>Tags</label>
                <md-chips v-model="tags" :md-limit="20" md-placeholder="Type a tag and press enter...">
                   <template slot="md-chip" slot-scope="{ chip }">
                     {{ chip }}
                     <!-- <small v-if="chip === currentProject">(Marcos Moura)</small> -->
                   </template>
                   <div class="md-helper-text">Please use tags to describe your sample</div>
                 </md-chips>
            </div>
          </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" @click="showInfoDialog=false">OK</md-button>
        <md-button class="md-primary" @click="showInfoDialog=false">Cancel</md-button>
      </md-dialog-actions>
      </md-dialog>
      <md-dialog :md-active.sync="showProcessDialog">
        <md-toolbar class="md-transparent md-dense" md-elevation="0">
          <div class="md-toolbar-row" flex>
              <div class="md-toolbar-section-start" >
                <h2>Processing with A-net</h2>
              </div>
          </div>
        </md-toolbar>
        <md-dialog-content>
            <label>Step 1: Select an shareLoc.xyz model:</label>
            <md-field>
              <!-- <label for="worker"></label> -->
              <md-select v-model="selected_worker_uri" name="worker" @md-selected="workerSelected">
                <md-option :value="worker.uri" v-for="worker in worker_list" :key="worker._id.$oid">{{worker.uri}}</md-option>
              </md-select>
            </md-field>
            <div v-if="selected_worker&&selected_worker.tags">
              <p v-if="selected_worker.description">{{selected_worker.description}}</p>
              <label>In order to use this model, your sample must contain the following tag(s):</label>
              <div class="md-layout-row md-gutter">
                <md-chip  v-for="tag in selected_worker.tags" :key="tag" :disabled="anet_running" @click="tags.indexOf(tag)<0?tags.push(tag):null" md-static md-clickable>
                  {{tag}}
                </md-chip>
                <div class="md-helper-text">You can click the above tag(s) to tag the sample.</div>
              </div>
            </div>
          <br>
            <div class="md-flex">
                <label>Step 2: tag your sample</label>
                <md-chips v-model="tags" :disabled="anet_running" :md-limit="20" md-placeholder="Type a tag and press enter...">
                   <template slot="md-chip" slot-scope="{ chip }">
                     {{ chip }}
                     <!-- <small v-if="chip === currentProject">(Marcos Moura)</small> -->
                   </template>
                   <div class="md-helper-text">Please make sure these tags describe your sample accurately.</div>
                </md-chips>
            </div>
            <br>
            <p>Warning: If the tags you provided do not match the actual content of your image, ** please do not trust the result **.</p>
            <md-switch v-model="use_widefield" v-if="this.widefield_available && this.selected_worker_uri && this.selected_worker_uri.indexOf('_wf')!== -1" name="include_widefield">Include widefield</md-switch>



            <br>
            <p>Currently, we only provide limited types of model trained with microtubules and mitochondria. In order to support more, please consider contributing your data through "project one-for-all".</p>
            <md-button class="md-primary" :disabled="loading_worker_list || anet_running" @click="sendForTraining()"><md-icon>send</md-icon>Send for Training</md-button>
            <!-- <md-switch v-model="support140">Join project 140</md-switch> -->
            <md-button class="md-primary" v-show="!show140" @click="show140=true">About project one-for-all</md-button>
            <br>
            <p v-if="worker_validation_msg">{{worker_validation_msg}}</p>

          <!-- <md-tabs md-fixed class="md-transparent">
            <md-tab id="hist-tab" md-label="PALM" :md-active="!show_anet_output">
              <canvas id="anet_input_canvas" width="2560" height="2560"></canvas>
            </md-tab>
            <md-tab id="anna-tab" md-label="shareLoc.xyz" :md-active="show_anet_output">
              <canvas id="anet_output_canvas" width="2560" height="2560" ></canvas>
            </md-tab>
          </md-tabs> -->
          <div class="md-layout-row md-gutter" v-if="anet_running">
            <div class="md-flex">
                <md-progress-spinner :md-diameter="100" :md-stroke="10" md-mode="indeterminate"></md-progress-spinner>
            </div>
          </div>
       </md-dialog-content>
       <md-dialog-actions>
           <!-- <md-button class="md-primary" v-show="!show140" @click="show140=true">Project 140</md-button> -->
           <md-button class="md-primary md-raised" :disabled="loading_worker_list || anet_running" @click="runAnetProcess()"><md-icon>play_arrow</md-icon>Process</md-button>
           <md-button class="md-primary" @click="showProcessDialog=false">Cancel</md-button>
       </md-dialog-actions>
      </md-dialog>

      <md-dialog :md-active.sync="show140">
        <md-toolbar class="md-transparent md-dense" md-elevation="0">
          <div class="md-toolbar-row" flex>
              <div class="md-toolbar-section-start">
                <h2>Please support project one-for-all -- one model for all</h2>
              </div>
          </div>
        </md-toolbar>
        <md-dialog-content>
          <p>As you may know that better results can be achieved if neural networks was trained on data with the same or similar type of data. Typically we need to train a dedicated model for each type of data or structure.</p>
          <p>However, this type of model will not scale, because we will end up with a huge collection of pretrained model files, consuming lots of resources and time to train but can not be used except for data looks similar. Plus, it will pose lots of challenges to the infrastructure to store, manage these models.</p>
          <p>To address this issue, we are initiating a project aiming for train a single neural network model for all types of biological structure, all types of labeling technique. </p>
          <p>The main idea is to train a single neural network incrementally with more and more data.</p>
          <p>It a hard task because when a single network sees different type of data, it will get confused between different types thus compromise the quality.</p>
          <p>The switch mechanism shown in our paper provides a way to allow the network to adjust itself to different type of data. While we have shown it works to train a single network for 2~3 types of data, we would like to scale the experiment to tens or even hundreds types.</p>
          <p>We will train the network 24x7, and it will be continuously improved as the amount of data grows. Snapshots of the trained model will be freely available for everyone.</p>

          <p>We name it "project one-for-all" or "project 140".</p>
          <p>The following components will be available for everyone as the project goes:</p>
          <p>- an open database for hosting localization microscopy data, accessible through <a href="#/repository" target="_blank">the repository</a>.</p>
          <p>- a portable smlm file format for saving large localization data, multi-channel, multi-FOV scanning, or even raw images.</p>
          <p>- pre-trained models for all types of structure, microscopy etc. </p>
          <br>
          <p>To support our mission, please donate your data to the project by clicking "Send for Training".</p>
         </md-dialog-content>
        <md-dialog-actions>
          <md-button class="md-primary md-raised"  @click="show140=false">OK</md-button>

        </md-dialog-actions>
      </md-dialog>


      <md-dialog :md-active.sync="showShareDialog" v-if="smlm">
        <md-dialog-content>
          <div class="md-layout-row md-gutter">
            <div class="md-flex">
              <md-toolbar class="md-transparent md-dense" md-elevation="0">
                <div class="md-toolbar-row" flex>
                    <div class="md-toolbar-section-start" >
                      <h2>Share your sample</h2>
                    </div>
                </div>
              </md-toolbar>

              <form v-if="smlm">
                <!-- <md-field v-for="(v, k) in smlm.manifest" :key="k" v-if="k!='formats' && k!='format_version' && k!='files' && k!='thumbnail' ">
                  <label>{{k}}</label>
                  <md-input v-model="smlm.manifest[k]" type="text"> </md-input>
                </md-field> -->
                <md-field>
                  <label>Name</label>
                  <md-input v-model="smlm.manifest.name" type="text"> </md-input>
                </md-field>
                <md-field>
                  <label>Description</label>
                  <md-input v-model="smlm.manifest.description" type="text"> </md-input>
                </md-field>
                <label>Tags</label>
                <md-chips v-model="smlm.manifest.tags" :md-limit="20" md-placeholder="type a tag and press enter...">
                   <template slot="md-chip" slot-scope="{ chip }">
                     {{ chip }}
                     <!-- <small v-if="chip === currentProject">(Marcos Moura)</small> -->
                   </template>
                   <div class="md-helper-text">Please use tags to describe the structure, labeled protein, the dye etc.</div>
                </md-chips>
                <md-switch v-model="get_shared_link" name="get_shared_link">Get a private shared link</md-switch>
                <md-switch v-model="make_public" name="make_public">Publish to the Repository</md-switch>
                <p v-show="make_public">A permanent public url will be generated for your data, and posted on the website. You won't be able to remove the url or the data, but you can tag it as 'deprecated'.</p>
                <md-autocomplete v-if="make_public" v-model="smlm.manifest.license" :md-options="licenses" md-dense>
                  <label>License</label>
                </md-autocomplete>
                <p v-if="make_public">To promote an open community, if no license specified, you data will be automatically licensed under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons Attribution 4.0 International license.</a> </p>
                <md-field v-if="make_public">
                  <label>How to cite?</label>
                  <md-input v-model="smlm.manifest.citeAs" type="text"></md-input>
                </md-field>
              </form>
              <div class="md-layout md-alignment-center-center">
                <img class="thumbnail-img" :src="smlm.manifest.thumbnail"  :alt="smlm.manifest.name">
              </div>
            </div>
          </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" v-if="store.authrole=='admin'" @click="shareSample(true, true); showShareDialog=false">Force Upload</md-button>
        <md-button class="md-primary" @click="shareSample(true); showShareDialog=false">OK</md-button>
        <md-button class="md-primary" @click="showShareDialog=false">Cancel</md-button>
      </md-dialog-actions>
      </md-dialog>

      <md-dialog :md-active.sync="showFilesDialog">
        <md-dialog-content>
          <div class="md-layout-row md-gutter">
            <div class="md-flex">
              <md-button class="md-primary " @click="showFilesDialog=false;selectFile(false)">
               <md-icon>add</md-icon> Load a new file
               <md-tooltip>Open a File</md-tooltip>
              </md-button>
              <md-button class="md-primary" @click="showFilesDialog=false;selectFile(true)">
                 <md-icon>add</md-icon>Append a file
                 <md-tooltip>Add an image to the current smlm file</md-tooltip>
              </md-button>
              <!-- <div class="dropbox">
                <input type="file" webkitdirectory mozdirectory msdirectory odirectory directory multiple @change="openFilesChange($event.target.name, $event.target.files); openFilesCount = $event.target.files.length" accept="image/*" class="input-file">
                  <p>
                    Drag your file(s) here to begin<br> or click to browse
                  </p>
              </div> -->

            </div>
          </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" @click="showFilesDialog=false">OK</md-button>
      </md-dialog-actions>
      </md-dialog>
      <md-dialog :md-active.sync="showSharedLink">
        <md-dialog-content>
          <div class="md-layout-row md-gutter">
            <div class="md-flex">
              <h1>Please copy the following URL for sharing</h1>
              <a :href="shared_link" target="_blank">{{shared_link}}</a>
            </div>
          </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" @click="showSharedLink=false">OK</md-button>
      </md-dialog-actions>
      </md-dialog>
 </div>
</template>

<script>
import { Filters, hot_lut } from '../utils.js'
import axios from 'axios';
import { saveAs } from 'file-saver';
import { smlmFile, native_formats, supported_text_formats, supported_image_formats, manifest_template } from '../smlmFile';
import { load3DViewer, show3DLocalizations } from '../pointCloud3D.js'
const pica = require('pica')();
// const yx = L.latLng

function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function dataURItoBlob(dataURI) {
    if(typeof dataURI !== 'string'){
        throw new Error('Invalid argument: dataURI must be a string');
    }
    dataURI = dataURI.split(',');
    var type = dataURI[0].split(':')[1].split(';')[0],
        byteString = atob(dataURI[1]),
        byteStringLength = byteString.length,
        arrayBuffer = new ArrayBuffer(byteStringLength),
        intArray = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteStringLength; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], {
        type: type
    });
}

export default {
  name: 'viewer',
  props: ['title'],
  data () {
    return {
      selected_s3_file: null,
      selected_smlm_file_hash: null,
      selected_smlm_file: null,
      filter_enabled: false,
      expandActions: false,
      menuVisible: false,
      show_filter: false,
      use_lut: true,
      use_3d: false,
      localizationNumber: 0,
      frameNumber: 0,
      histogram_image: null,
      rendering_status: '',
      rendering_progress: 0,
      filter_expression: '',
      filter_tooltip: '',
      histogram_width: 2560,
      histogram_height: 2560,
      filter_ranges:{},
      selected_filter: null,
      selected_filter_max: 0,
      selected_filter_min: 0,
      rendering: false,
      rendered: false,
      render3d_loaded: false,
      export_histogram_png: null,
      map: null,
      fps:0,
      ppf:0,
      selected_file: null,
      renderWorker: null,
      filterWorker: null,
      hist_table: [],
      options: null,
      showInfoDialog: false,
      showShareDialog: false,
      showFilesDialog: false,
      showErrorDialog: false,
      error_content: 'error occured.',
      text_file_format: '',
      running_status: '',
      running: false,
      running_progress: 0,
      running: false,
      smlm: null,
      channel_name: 'default',
      pixel_size: 20,
      offset_x: 0,
      offset_y: 0,
      // delimiter: ',',
      offset_mode: 'min-max',
      running_progress: 0,
      selected_channel: 0,
      tags: [],
      metadata: {},
      show_more_import_options: false,
      append_mode: false,
      showImportDialog: false,
      get_shared_link: true,
      make_public: false,
      licenses: ['CC BY 4.0', 'CC BY-NC 4.0', 'CC BY-SA 4.0', 'CC BY-ND 4.0'],
      shared_link: '',
      showSharedLink: false,
      loaded_sample: null,
      loading_shared_url: false,
      shared_url_mode: false,
      showProcessDialog: false,
      openFilesCount: 0,
      anet_running: false,
      anet_taskid: null,
      screenWidth: 0,
      show_anet_output: false,
      anet_output_available: false,
      anet_output_img: null,
      anet_output_sample_hash: null,
      current_render2d_config: {brightness: 1},
      hist_render2d_config: {brightness: 1},
      anet_render2d_config: {brightness: 1},
      supported_file_formats: {},
      file_sample_lines: '',
      use_widefield: false,
      widefield_available: false,
      worker_list: [],
      worker_validation_msg: null,
      file_tags: [],
      selected_worker: null,
      selected_worker_uri: null,
      loading_worker_list: false,
      leafletMap: null,
      _canvas_layer: null,
      _canvas_data: null,
      current_displaying: null,
      show140: false,
      support140: true,
      showUploading: false,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api,
    }
  },
  watch: {
  	menuVisible () {
    	setTimeout(() => {
        if(this.$refs['filter-slider'])
          this.$refs['filter-slider'].refresh()
        if(this.$refs['brightness-slider'])
          this.$refs['brightness-slider'].refresh()
        this.leafletMap.invalidateSize();
        this.$forceUpdate()
        // const evt = window.document.createEvent('UIEvents');
        // evt.initUIEvent('resize', true, false, window, 0);
        // window.dispatchEvent(new Event('resize'))

      }, 800)
    }
  },
  mounted(){
    this.screenWidth = window.innerWidth
    this.store.event_bus.$on('resize', (newsize)=>{
      this.screenWidth = newsize.width
      console.log('window size changed.', newsize.width)
      if(newsize.width>1000 && !this.menuVisible && this.options){
        this.menuVisible = true;
      }
      else if(newsize.width<=1000 && this.menuVisible){
        this.menuVisible = false;
      }
    })

    this.supported_file_formats = {}
    Object.assign(this.supported_file_formats, {'SMLM format': {}})
    Object.assign(this.supported_file_formats, supported_text_formats)
    Object.assign(this.supported_file_formats, supported_image_formats)
    if(this.$route.path == 'viewer'){
      return
    }

    // this is needed to for chrome to work
    this.filterWorker = new Worker("static/js/AsyncFilter.js")
    this.renderWorker = new Worker("static/js/AsyncRenderer.js")

    const load_sample = ()=>{
      if(!this.store.session || this.loading_shared_url || this.loaded_sample){
        return
      }
      if((this.$route.query.sample && this.$route.query.token) || this.$route.query.u || (this.store.authrole=='admin' && this.$route.query.sample)){
        this.shared_url_mode = true
        if(this.$route.query.u){
            this.loadSample({'public_uuid': this.$route.query.u})
        }
        else{
            this.loadSample({'hash': this.$route.query.sample, 'shared_token': this.$route.query.token})
        }
      }
      else{
        this.shared_url_mode = false
      }
    }
    load_sample()
    if(this.store.signed_in){
      load_sample()
    }
    else{
      this.store.event_bus.$on('connected', load_sample)
    }


    // if(window.innerWidth>1000){
    //   this.menuVisible = true;
    // }

    //
    // this.leafletMap = L.map('leaflet_histogram', {
    //   minZoom: 1,
    //   maxZoom: 100,
    //   center: [0, 0],
    //   zoom: 1,
    //   crs: L.CRS.Simple
    // });

  },
  methods: {
    workerSelected(uri){
      this.selected_worker = null
      for(let i=0;i<this.worker_list.length;i++){
        if(this.worker_list[i].uri == uri){
          this.selected_worker = this.worker_list[i]
          break
        }
      }

    },
    updateCanvas(){
      if(this.show_anet_output){
        this.current_render2d_config = this.anet_render2d_config
        const img = this.anet_output_img
        var canvas = document.createElement("canvas");
        canvas.width = img.width
        canvas.height = img.height
        this.histogram_width = canvas.width
        this.histogram_height = canvas.height
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0)
        var canvas_img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.render_canvas(canvas_img_data, this.current_render2d_config.brightness)
      }else{
        // var canvas = document.getElementById("histogram_canvas");
        // canvas.width = this.histogram_width
        // canvas.height = this.histogram_height
        this.current_render2d_config = this.hist_render2d_config
        this.render_canvas(null, this.current_render2d_config.brightness)
      }

    },
    shareFile(){
      if(this.store.signed_in){
        this.generateThumbnail().then(()=>{
          this.showShareDialog=true
          if(this.smlm) this.smlm.manifest.license = this.smlm.manifest.license || 'CC BY 4.0'
        }).catch((e)=>{
          console.error(e)
          this.api.show("something went wrong.", 5000)
          this.error_content = "Failed to share this sample, something went wrong."
          this.showErrorDialog = true
        })
      }
      else
        this.api.showLogin()
    },
    openFilesChange(fieldName, fileList){
      if (!fileList.length) return;
      console.log(fieldName, fileList)
    },
    getFileExtension(filename) {
      return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
    },
    loadSample(sample_query){
      this.loading_shared_url=true
      this.store.session.call('org.imod.public.get_shared_sample', [sample_query], {}, {disclose_me: true}).then((sample)=>{
        console.log('sample loaded', sample)
        this.loaded_sample = sample
        this.tags = sample.tags.slice()
        this.thumbnail = sample.thumbnail
        const file_hash = sample.hash || Object.keys(sample.files)[0]
        if(sample.files[file_hash]){
          this.loadS3File(sample.files[file_hash], file_hash).then(()=>{
            this.loading_shared_url = false
          }).catch((e)=>{
            console.error(e)
            this.api.show("Error occured during loading.", 5000)
            this.loading_shared_url = false
            this.error_content = "Failed to load the sample, maybe it was removed."
            this.showErrorDialog = true
            this.running_status = "Error: Failed to load the sample, maybe it was removed."
          })
        }
        else{
          this.api.show("Error: no file found in the sample.", 5000)
          this.loading_shared_url = false
          this.error_content = "There is no file in the sample."
          this.showErrorDialog = true
          this.running_status = "Error: There is no file in the sample."
          // this.showFilesDialog = true
          // this.loading_shared_url = false
        }

      }).catch((reason)=>{
        console.error(reason)
        this.error_content = "Sample was not found."
        this.showErrorDialog = true
        this.api.show(reason.args[0], 5000)
        this.loading_shared_url = false
        this.running_status = "Error: Sample was not found."
      })
    },
    loadS3File(f, h){
      return new Promise((resolve, reject) => {
        if(this.selected_s3_file == h){
          resolve()
          return
        }
        const sample_query = {}
        if(this.loaded_sample.public && this.loaded_sample.public_uuid){
          sample_query.public_uuid = this.loaded_sample.public_uuid
        }
        else{
          sample_query.hash = this.loaded_sample.hash
          sample_query.shared_token = this.loaded_sample.shared_token
        }
        this.store.session.call('org.imod.public.get_shared_sample_file', [sample_query, f.hash], {}, {disclose_me: true}).then((ret)=>{
          console.log('file url', ret.url)
          axios.get(ret.url, {responseType: 'blob'}).then((response) => {
            console.log(response)
            const file = response.data
            const file_name = file.name || f.name
            this.selected_file_name = file_name
            this.selected_file = file
            if(file.type=='application/zip' || file.type=='application/smlm' || (file_name && file_name.endsWith('.smlm'))){
              this.loadSmlm()
            }
            else{
              this.loadFile()
            }
            this.tags = this.loaded_sample.tags.slice()
            this.thumbnail = this.loaded_sample.thumbnail
            this.selected_s3_file=h;
            resolve()
          }).catch((e)=>{
            reject(e)
          })
        }).catch((reason)=>{
          console.error(reason)
          this.api.show(reason.args[0])
          reject(reason)
        })
      })
    },
    loadSmlmFile(file_info){
      console.log('loading ...', file_info)
       this.file_tags = file_info.tags
       if(file_info.type == "table"){
         this.options = Object.assign({'xy_range': [0, 0, 0, 0], 'pixel_size': this.pixel_size, frame_range: [0, 0]}, file_info.data)
         // this.shareSample(data.tableArrays, filtered_metadata)
         this.reset_filters()
         this.filter_enabled = true
       }
       else if(file_info.type == "image"){
         this.options = {}
         // this.current_task.histogram = ret.hist
         this.plotImage(file_info.data.image)
       }
       else{
         console.error('file type not supported', file_info)
       }
       this.selected_smlm_file_hash = file_info.hash
       this.selected_smlm_file = file_info
    },
    generateThumbnail(size){
      return new Promise((resolve, reject) => {
        let original = null
        if(this.use_3d){
          this.api.show('Please switch to 2D mode to generate a thumbnail image for sharing.')
          reject()
          return
        }
        else{
          if(!this._canvas_data){
            this.api.show('No data available.')
            reject()
            return
          }
          original = document.createElement("canvas")
          original.width = this.histogram_width
          original.height = this.histogram_height
          var ctx = original.getContext("2d");
          ctx.putImageData(this._canvas_data, 0, 0)
        }
        const canvas = document.createElement("canvas")
        canvas.width = size || 192
        canvas.height = canvas.width * (original.height / original.width);
        // Resize from Canvas/Image to another Canvas
        pica.resize(original, canvas, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        })
        .then((result) => {
          // console.log('resize done!')
          this.smlm.manifest.thumbnail = canvas.toDataURL()
          resolve(this.smlm.manifest.thumbnail)
        }).catch((e)=>{
          reject(e)
        })

        //
        // canvas.width = size || 192
        // // set size proportional to image
        // canvas.height = canvas.width * (original.height / original.width);
        // // step 1 - resize to 50%
        // var oc = document.createElement('canvas'),
        //     octx = oc.getContext('2d');
        // oc.width = original.width * 0.5;
        // oc.height = original.height * 0.5;
        // octx.drawImage(original, 0, 0, oc.width, oc.height);
        // // step 2
        // octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);
        // // step 3, resize to final size
        // const ctx = canvas.getContext("2d")
        // ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
        // 0, 0, canvas.width, canvas.height);


        //
        // canvas.width = size || 192
        // canvas.height = size || 192
        // const ctx = canvas.getContext("2d")
        // // ctx.filter = 'blur(0.5px)'
        // ctx.drawImage(original, 0, 0, canvas.width, canvas.height)

        // return this.smlm.manifest.thumbnail
      })
    },
    switchChannel(ch){
      console.log(ch)
    },
    selectFile(append){
      this.append_mode = append
      this.running_progress = 0
      this.$refs.select_file_input.click()
    },
    updateStatus(status){
      if(status.running){
        this.running = status.running
      }
      if(status.running_status){
        this.running_status = status.running_status
      }
      if(status.running_progress){
        this.running_progress = status.running_progress
      }
    },
    fileSelected(e){
      const files = e.target.files
      console.log('file selected', files)
      if (files && files.length>0){
        if(files.length==1){
          this.selected_file_name = files[0].name
        }
        else{
          this.selected_file_name = files[0].name + ", " + files[1].name + " etc."
        }
        console.log(files)
        this.selected_file = files[0]

        if(this.selected_file_name.endsWith('.smlm') || this.selected_file.type == 'application/zip' || this.selected_file.type == 'application/smlm'){
          this.loadSmlm()
        }
        else{
          var r = new FileReader();
          var blob = this.selected_file.slice(0, 100);
          r.onload = (evt)=>{
            this.file_sample_lines = evt.target.result.split('\n').slice(0,2)
            if(this.file_sample_lines[0].includes('x [nm]') && this.file_sample_lines[0].includes('\t')){
              this.text_file_format = 'ThunderSTORM (xls)'
            }
            else if(this.file_sample_lines[0].includes('x [nm]') && this.file_sample_lines[0].includes(',')){
              this.text_file_format = 'ThunderSTORM (csv)'
            }
            else if(this.file_sample_lines[0].includes('Position X [nm]') && this.file_sample_lines[0].includes('\t')){
              this.text_file_format = 'ZEISS (txt)'
            }
            else if(this.file_sample_lines[0].includes('Position X [nm]') && this.file_sample_lines[0].includes(';')){
              this.text_file_format = 'ZEISSv1 (csv)'
            }
            else if(this.file_sample_lines[0].includes('x [nm]') && this.file_sample_lines[0].includes(';')){
              this.text_file_format = 'ZEISSv2 (csv)'
            }
            else if(this.file_sample_lines[0].startsWith('#') && this.file_sample_lines[0].includes('identifier=')){
              this.text_file_format = 'RapidSTORM (txt)'
            }
            else if(this.file_sample_lines[0].includes('x ') && this.file_sample_lines[0].includes('y ')){
              this.text_file_format = 'Space Seperated List (txt)'
            }
            else if(this.selected_file_name.endsWith('.png')){
              this.text_file_format = 'png'
            }
            else if(this.selected_file_name.endsWith('.jpg')){
              this.text_file_format = 'jpg'
            }
            else if(this.selected_file_name.endsWith('.jpeg')){
              this.text_file_format = 'jpeg'
            }
            else{
              console.log('file format is not recognized', this.selected_file.name)
            }

            if(this.selected_file_name.endsWith('.png') || this.selected_file_name.endsWith('.jpg')|| this.selected_file_name.endsWith('.jpeg')){
              this.tags = ['#WF']
            }
            else{
              this.tags = ['#SR']
            }
            this.append_mode = false
            this.showImportDialog = true
          };
          r.onerror = ()=> {
            this.show("can't read file", 5000)
          }
          r.readAsText(blob);
        }
     }
    },
    stopAnetProcess(){
      if(this.anet_taskid){
        this.store.session.call('org.imod.user.tasks.update_task', [this.anet_taskid,  {closed: true}], {}, {disclose_me: true}).then((taskid)=>{
          this.api.show("task stopped.")
        }).catch((reason)=>{
          console.error(reason)
          this.api.show(reason.args[0])
        })
      }

      this.use_widefield = false
      this.anet_running = false
      this.showProcessDialog=false
      this.anet_output_sample_hash = null
      this.anet_output_available = false
      this.show_anet_output = false

    },
    sendForTraining(overwrite){
      this.anet_running = true
      // if(!this.support140){
      //   this.worker_validation_msg = "Please train your data by switching on 'join project 140'."
      //   this.api.show("Please switch on 'join project 140'", 5000)
      //   this.anet_running = false
      //   return
      // }
      this.uploadSample(overwrite).then(()=>{
        this.getSharedURL(this.smlm.manifest.hash, false).then((shared_dict)=>{
          const task_info = {}
          // if(this.selected_worker.task_template){
          //   Object.assign(task_info, this.selected_worker.task_template)
          // }
          Object.assign(task_info, {name: 'training_task_'+this.smlm.manifest.name, type: 'train', inputs: [shared_dict], config: {'input_file_hash': this.smlm.manifest.hash, 'input_file_name': this.smlm.manifest.name}, tags: ['@140']})
          this.store.session.call('org.imod.user.tasks.add_task', [task_info], {}, {disclose_me: true}).then((taskid)=>{
             console.log('send data for training, task id:', taskid, task_info)
             this.api.show('Data sent for training', 5000)
             this.anet_running = false
          }).catch((e)=>{
            console.error(e)
            this.api.show('failed to notify the worker', 5000)
            this.anet_running = false
          })
        }).catch((e)=>{
          console.error(e)
          this.api.show('failed to share the file with the worker', 5000)
          this.anet_running = false
        })
      }).catch((e)=>{
        console.error(e)
        this.api.show('failed to send file', 5000)
        this.anet_running = false
      })
    },
    runAnetProcess(){
      this.anet_running = true
      console.log(this.selected_worker,  this.tags)
      this.worker_validation_msg = null
      if(this.selected_worker){
        if(this.selected_worker.tags && this.tags){
          for(let i=0;i<this.selected_worker.tags.length;i++){
            const tag = this.selected_worker.tags[i]
            console.log(this.tags.indexOf(tag)<0, tag)
            if(this.tags.indexOf(tag)<0){
              this.worker_validation_msg = "This worker can only work with samples tagged with '" + this.selected_worker.tags.join(",") + "'"
              this.api.show("You must tag your sample with at least: " + tag, 5000)
              this.anet_running = false
              return
            }
          }
        }
      }
      else{
        this.api.show("Please select a worker.", 5000)
        this.worker_validation_msg = "Please select a worker."
        this.anet_running = false
        return
      }


      // if(this.histogram_width != 2560 || this.histogram_height != 2560){
      //   this.api.show("Currently, we can only process image with the size 2560x2560.", 5000)
      //   return
      // }
      var blob = dataURItoBlob(this.histogram_image)
      this.smlm.manifest.tags = this.smlm.manifest.tags || []
      // if(this.smlm.manifest.tags.indexOf('#test') <0)
      //   this.smlm.manifest.tags.push('#test')

      const file_hash = SparkMD5.hash(this.smlm.manifest.hash+this.selected_smlm_file_hash+this.filter_expression+'pixel_size:'+this.pixel_size)
      const output_hash = SparkMD5.hash(file_hash+'anet_output')
      this.anet_output_sample_hash = output_hash
      this.selected_smlm_file.tags = this.selected_smlm_file.tags || []
      const file_tags = this.selected_smlm_file.tags.slice()
      file_tags.push('#input')
      this.smlm.manifest.tags = this.smlm.manifest.tags || []
      const sample_tags = this.smlm.manifest.tags.slice()
      sample_tags.push('#output')

      const addTask = (fileKey, hashSR, hashWF)=>{
        hashSR = hashSR || null
        hashWF = hashWF || null
        this.anet_running = true
        this.store.session.call("org.imod.user.samples.get_shared_link", [this.anet_output_sample_hash, false], {}, {disclose_me: true}).then((shared_dict)=>{
          console.log(shared_dict)
          if(!shared_dict.public_uuid && ! shared_dict.shared_token){
            this.api.show('Failed to get a shared link', 5000)
            this.anet_running = false
            return
        }
          this.store.session.call("org.imod.user.files.get_upload_url", [{name: 'anet_output', type: 'image/png', tags: ['#output'], sample_hash:this.anet_output_sample_hash, hash: output_hash}, true], {}, {disclose_me: true}).then((output_file)=>{
            console.log('get upload url for output file', output_file)
            const task_info = {}
            if(this.selected_worker.task_template){
              Object.assign(task_info, this.selected_worker.task_template)
            }
            Object.assign(task_info, {name: 'task_'+fileKey, type: 'test', inputs: [shared_dict], config: {'input_file': hashSR, 'input_sr_file': hashSR, 'input_pixel_size': this.pixel_size, 'output_file': output_file, 'input_wf_file': hashWF, 'wf_pixel_size': this.pixel_size}, tags: ['@'+this.selected_worker_uri], expiresIn: 120})
            this.store.session.call('org.imod.user.tasks.add_task', [task_info], {}, {disclose_me: true}).then((taskid)=>{
              this.anet_taskid = taskid
              const taskUpdated = (results) => {
                const result = results[0]
                console.log(result)
                if(result.closed){
                  if(result.error){
                      this.api.show(result.error, 5000)
                  }
                  else{

                    console.log('data uploaded, finishing', result.outputs.output_file)
                    this.store.session.call("org.imod.user.files.finish_upload", [output_file.key, result.outputs.output_file], {}, {disclose_me: true}).then((res2)=>{
                      console.log('finished output data upload')
                      this.api.show('process done', 4000)
                      // this.store.session.call("org.imod.user.samples.get_shared_link", [this.anet_output_sample_hash, false], {}, {disclose_me: true}).then((shared_dict2)=>{
                      //   console.log(shared_dict2)
                      //   if(!shared_dict2.public_uuid && ! shared_dict2.shared_token){
                      //     this.api.show('Failed to get a shared link', 5000)
                      //     return
                      //   }
                        this.store.session.call('org.imod.public.get_shared_sample', [shared_dict], {}, {disclose_me: true}).then((sample)=>{
                          console.log('output sample loaded', sample)
                          this.store.session.call('org.imod.public.get_shared_sample_file', [shared_dict, output_hash], {}, {disclose_me: true}).then((ret)=>{
                            console.log('output file url', ret.url)
                            axios.get(ret.url, {responseType: 'blob'}).then((response) => {
                              console.log(response)
                              const file = response.data
                              const a = new FileReader();
                              a.onload = (e)=>{
                                const img = new Image();
                                img.addEventListener("load", ()=>{
                                  this.anet_output_img = img
                                  this.show_anet_output = true
                                  this.anet_output_available = true
                                  this.anet_render2d_config.brightness = 0
                                  this.updateCanvas()
                                  if(!this.support140){
                                    this.show140 = true
                                  }
                                  // this.plotImage(img)
                                })
                                img.src = e.target.result
                              }
                              a.readAsDataURL(file)
                              this.showProcessDialog=false
                              this.anet_running = false;
                            }).catch((e)=>{
                              console.error(e)
                              this.api.show(e)
                              this.anet_running = false
                            })
                          }).catch((reason)=>{
                            console.error(reason)
                            this.api.show(reason.args[0])
                            this.anet_running = false
                          })
                        }).catch((reason)=>{
                          console.error(reason)
                          this.error_content = "Sample was not found."
                          this.api.show(reason.args[0], 5000)
                          this.anet_running = false
                        })

                      // }).catch((err)=>{
                      //   console.error(reason)
                      //   this.error_content = "Sample was not found."
                      //   this.api.show(reason.args[0], 5000)
                      //
                      // })
                    }).catch((err)=>{
                      console.error(err)
                      this.api.show("upload failed, please try again.", 5000)
                      this.anet_running = false
                    })

                  }
                  console.log('task closed: ', updates)
                  this.anet_running = false;
                  this.showProcessDialog=false;
                  this.store.session.unsubscribe('org.imod.user.task.' + taskid.$oid)
                }
                console.log('task updated: ', updates)
              }
              this.store.session.subscribe('org.imod.user.task.' + taskid.$oid, taskUpdated)
              console.log('task added.')
            }).catch((reason)=>{
              console.error(reason)
              this.api.show(reason.args[0])
              this.anet_running = false
            })
          }).catch((e)=>{
            console.error(e)
            this.api.show('Failed to get a upload link', 5000)
            this.anet_running = false
          })
        }).catch((e)=>{
          console.error(e)
          this.api.show('Failed to get a shared link', 5000)
          this.anet_running = false
        })
      }

      this.generateThumbnail().then(()=>{
        console.log('update thumbnail for sample')
        const file_props = {name: 'rendering_' + this.smlm.manifest.name + '.png',
                            size: blob.size,
                            type: blob.type,
                            sample_hash: this.anet_output_sample_hash,
                            sample_config: {
                              hash: this.anet_output_sample_hash,
                              description: this.smlm.manifest.description,
                              tags: sample_tags,
                              uid: this.store.uid,
                              thumbnail: this.smlm.manifest.thumbnail,
                            },
                            hash: file_hash,
                            tags: file_tags,
                            license: this.smlm.manifest.license,
                            citeAs: this.smlm.manifest.citeAs,
                            metadata:{filter_expression: this.filter_expression}
                           }

        console.log(file_props)

        //displaying widefield image
        if(this.current_displaying == 'image'){
          if(this.use_widefield){
            this.uploadWidefieldImage(this.anet_output_sample_hash, file_props.sample_config).then((fileKeyWF)=>{
              addTask(fileKeyWF, null, this.widefield_available.hash)
            }).catch((e)=>{
              console.log(e)
              this.api.show(e)
              this.anet_running = false
            })
          }
          else{
            this.api.show('You are displaying an image, please switch on use widefield.')
            this.anet_running = false
          }
          return
        }
        //displaying histogrames
        else{
          this.getUploadUrl(file_props).then((res)=>{
            const signedUrl = res.url;
            const fileKey = res.key;
            if((!signedUrl || signedUrl=== null) && fileKey){
              console.log('file already uploaded, add task.')
              // this.api.show("The same file has already been uploaded.", 4000)
              if(this.use_widefield){
                this.uploadWidefieldImage(this.anet_output_sample_hash).then((fileKeyWF)=>{
                  addTask(fileKey, file_hash, this.widefield_available.hash)
                }).catch((e)=>{
                  console.log(e)
                  this.api.show(e)
                })
              }
              else{
                addTask(fileKey, file_hash)
              }
              return
            }
            this.uploadFile(blob, file_props, fileKey, signedUrl).then(()=>{
              if(this.use_widefield){
                this.uploadWidefieldImage(this.anet_output_sample_hash).then((fileKeyWF)=>{
                  addTask(fileKey, file_hash, this.widefield_available.hash)
                }).catch((e)=>{
                  console.log(e)
                  this.api.show(e)
                })
              }
              else{
                addTask(fileKey, file_hash)
              }
              //this.shareSample()
            }).catch((e)=>{
              console.log(e)
              this.api.show(e)
              this.anet_running = false
            })
          }).catch((e)=>{
            console.log(e)
            this.api.show(e)
            this.anet_running = false
          })
        }

      }).catch((e)=>{
        console.error(e)
        this.api.show("something went wrong.")
        this.anet_running = false
      })

    },
    uploadWidefieldImage(sample_hash, sample_config){
      return new Promise((resolve, reject) => {
        if(!this.widefield_available || this.widefield_available.type != 'image'){
          reject()
          return
        }
        const file = this.widefield_available.data.file
        console.log(this.widefield_available)

        const wf_file = this.widefield_available
        const file_props = {
          name: wf_file.name,
          type: 'image/png',
          tags: wf_file.tags,
          hash: this.widefield_available.hash,
          sample_hash: sample_hash,
          sample_config: sample_config
        }
        this.getUploadUrl(file_props).then((res)=>{
          const signedUrl = res.url;
          const fileKey = res.key;
          if((!signedUrl || signedUrl=== null) && fileKey){
            console.log('widefield already uploaded')
            resolve(fileKey)
          }
          else{
            this.uploadFile(file, file_props, fileKey, signedUrl).then((fileKey)=>{
              console.log('widefield uploaded')
              // this.smlm.uploaded = true
              resolve(fileKey)
            })
          }
        }).catch((e)=>{
          console.log(e)
          this.api.show(e)
          reject(e)
        })

      })
    },
    showAnetProcess(){
      if(!this.store.signed_in || !this.store.session){
        this.api.showLogin()
        this.api.show("please login or signup with your email.")
        return
      }
      this.worker_validation_msg = null
      this.anet_output_sample_hash = null
      this.anet_output_available = false
      this.show_anet_output = false

      this.showProcessDialog=true
      this.loading_worker_list = true
      this.support140=true


      let wf = null
      for(let i=0;i<this.smlm.files.length;i++){
        if(this.smlm.files[i].tags&&this.smlm.files[i].tags.indexOf('#WF')>=0){
          wf = this.smlm.files[i]
          break
        }
      }
      if(!wf || wf.type != 'image'){
        this.widefield_available = null
        this.use_widefield = false
      }
      else{
        this.widefield_available = wf
        this.use_widefield = true
      }
      this.store.session.call("org.imod.public.get_worker_stats", [], {}, {disclose_me: true}).then((res)=>{
        this.api.show("worker list updated.")
        this.worker_list = res
        this.loading_worker_list = false
        // if(this.worker_list && this.worker_list.length >0 && this.worker_list[0]){
        //   this.selected_worker_uri = this.worker_list[0].uri
        //   this.workerSelected()
        // }

      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
        this.loading_worker_list = false
      })
    },
    loadFile(){
      if(this.text_file_format == 'SMLM format'){
        this.loadSmlm()
      }
      else if(this.selected_file_name.endsWith('.png')){
        this.loadImageFile('png')
      }
      else if(this.selected_file_name.endsWith('.jpg')){
        this.loadImageFile('jpg')
      }
      else if(this.selected_file_name.endsWith('.jpeg')){
        this.loadImageFile('jpg')
      }
      else{
        this.loadTextFile(this.text_file_format)
      }

    },
    loadImageFile(selected_format){
      console.time('load image file');
      const smlm = this.append_mode && this.smlm ? this.smlm : new smlmFile();
      const info = {offset:{x:this.offset_x, y:this.offset_y}, tags: this.tags, channel:this.channel_name, pixel_size: this.pixel_size}
      this.options = this.options || {}
      smlm.import_image(this.selected_file, selected_format, info, this.append_mode, this.updateStatus).then((file_info)=>{
        this.file_tags = file_info.tags
        this.running = false
        const metadata = file_info.metadata
        this.metadata = metadata
        console.timeEnd('load image file');
        // const filtered_metadata = {}
        // for(let k in metadata){
        //   if(metadata[k])
        //   filtered_metadata[k] = metadata[k].toString()
        // }
        // console.log('metadata:', filtered_metadata)
        this.rendering_status =  "image loaded"
        this.rendering_progress = 100
        this.rendering = false
        this.rendered = true
        // this.options = {}
        // this.current_task.histogram = ret.hist
        // this.plotImage(data.image)
        this.api.show("image loaded.", 3000)
        this.smlm = smlm
        this.loadSmlmFile(file_info)
        this.selected_filter = null
        this.tags = this.smlm.manifest.tags.slice()
        this.filter_enabled = false
      }).catch((e)=>{
        this.running = false
        console.log(e)
        this.api.show(e, 5000)
      })
    },
    plotImage(img){
      this.histogram_width = img.width
      this.histogram_height = img.height
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext("2d")
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      this.histogram_image = canvas.toDataURL("image/png")
      console.log('tags:', this.tags)
      if(this.tags.indexOf('#SR')>=0){
        this.current_displaying = 'hist'
      }
      else{
        this.current_displaying = 'image'
        //this.histogram_image = canvas.toDataURL("image/png")
      }
      var canvas_img_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      this.render_canvas(canvas_img_data)


    },
    loadTextFile(selected_format){
      console.time('load text file', selected_format);
      const smlm = this.append_mode && this.smlm ? this.smlm : new smlmFile();
      // do not support append for now
      // this.append_mode = false;
      // this.hist_render2d_config.brightness = 100
      const info = {offset:{x:this.offset_x, y:this.offset_y}, tags: this.tags, channel:this.channel_name, pixel_size: this.pixel_size}
      smlm.import_text_table(this.selected_file, selected_format, info, this.append_mode, this.updateStatus).then((file_info)=>{
        this.file_tags = file_info.tags
        this.running = false
        console.timeEnd('load text file');
        console.log(file_info)
        const metadata = file_info.metadata
        this.metadata = metadata
        // const filtered_metadata = {}
        // for(let k in metadata){
        //   if(metadata[k])
        //   filtered_metadata[k] = metadata[k].toString()
        // }
        // console.log('metadata:', filtered_metadata)
        this.api.show("file loaded.", 3000)
        // this.options = Object.assign({'xy_range': [0, 0, 0, 0], 'pixel_size': this.pixel_size, frame_range: [0, 0]}, data)
        // // this.shareSample(data.tableArrays, filtered_metadata)
        // this.reset_filters()
        this.smlm = smlm
        this.loadSmlmFile(file_info)
        this.tags = this.smlm.manifest.tags.slice()
        this.filter_enabled = true
      }).catch((e)=>{
        this.running = false
        console.log(e)
        this.api.show(e, 5000)
      })
    },
    loadSmlm(){
      console.time('load smlm file');
      const smlm = new smlmFile();
      // do not support append for now
      this.append_mode = false;
      smlm.import_smlm(this.selected_file, this.append_mode, this.updateStatus).then((files)=>{
        this.running = false
        console.timeEnd('load zip file');

        // const filtered_metadata = {}
        // for(let k in metadata){
        //   if(metadata[k])
        //   filtered_metadata[k] = metadata[k].toString()
        // }
        // console.log('metadata:', filtered_metadata)
        this.api.show("file loaded.", 3000)
        // this.options = Object.assign({'xy_range': [0, 0, 0, 0], 'pixel_size': this.pixel_size, frame_range: [0, 0]}, data)
        // this.reset_filters()
        this.smlm = smlm
        this.tags = this.smlm.manifest.tags.slice()

        const file_info = files[0]
        this.metadata = file_info.metadata
        this.loadSmlmFile(file_info)

        this.filter_enabled = true
      }).catch((e)=>{
        this.running = false
        console.log(e)
        this.api.show(e, 5000)
        this.running_status = e
        // this.running = false
      })
    },
    getSharedURL(sample_hash, return_link){
      return new Promise((resolve, reject) => {
        const hostname = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '');
        this.store.session.call("org.imod.user.samples.get_shared_link", [sample_hash, this.make_public], {}, {disclose_me: true}).then((ret)=>{
            console.log(ret)
            if(ret.msg){
              this.api.show(ret.msg, 5000)
            }
            if(this.make_public && !ret.public_uuid){
              alert('This sample was uploaded by someone else before, you cannot make it public, but you can contact the administrator to override this.')
            }
            if(!return_link){
               if(ret.public_uuid || (ret.hash && ret.shared_token)){
                 resolve(ret)
                 return
               }
               else{
                 reject(ret)
                 return
               }
            }
            else{
              if(ret.public_uuid){
                const shared_link = hostname+'/#/view?u='+ret.public_uuid
                console.log(shared_link, ret)
                this.$router.push({
                  path: '/view',
                  query: {'u': ret.public_uuid}
                })
                resolve(shared_link)
              }
              else if(ret.hash && ret.shared_token){
                console.log('shared link:', hostname+'/#/view?sample='+ret.hash+'&token='+ret.shared_token)
                const shared_link = hostname+'/#/view?sample='+ret.hash+'&token='+ret.shared_token
                console.log(shared_link, ret)
                this.$router.push({
                  path: '/view',
                  query: {'sample': ret.hash, 'token': ret.shared_token}
                })
                resolve(shared_link)
              }
              else{
                console.error('error', ret)
                this.api.show("error occured when getting shared url.", 5000)
                reject(ret)
              }
            }
           //this.showSharedLink = true
        })
      })
    },
    shareSample(showSharedLink, overwrite){
      return new Promise((resolve, reject) => {
      this.showUploading = true
      this.running_status = 'Preparing for sharing...'
      this.uploadSample(overwrite).then(()=>{
        this.showUploading = false
        if(this.get_shared_link || showSharedLink){
          this.getSharedURL(this.smlm.manifest.hash, true).then((url)=>{
            console.log(url)
            if(this.anet_output_available && this.show_anet_output && this.anet_output_sample_hash){
              this.getSharedURL(this.anet_output_sample_hash, true).then((url2)=>{
                this.shared_link = url2
                this.showSharedLink = showSharedLink
                resolve()
              }).catch((e)=>{
                console.error(e)
                this.api.show(e)
              })
            }
            else{
              this.shared_link = url
              this.showSharedLink = showSharedLink
              resolve()
            }
          })
        }
      }).catch((e)=>{
        this.running_status = 'Something went wrong when sharing sample.'
        console.error(e)
        this.api.show('something went wrong when sharing sample.', 5000)
      })
      })
    },
    uploadSample(overwrite){
      return new Promise((resolve, reject) => {
        if(!this.smlm.uploaded){
          // close render worker for memory
          if(this.renderWorker){
            this.renderWorker.terminate()
            this.renderWorker = null
          }
          if(!this.smlm.manifest.name.endsWith('.smlm')){
            this.smlm.manifest.name = this.smlm.manifest.name + '.smlm'
          }
          const file_props = {name: this.smlm.manifest.name,
                              type: 'application/smlm',
                              sample_hash: this.smlm.manifest.hash,
                              sample_config: {
                                uid: this.store.uid,
                                hash: this.smlm.manifest.hash,
                                description: this.smlm.manifest.description,
                                tags: this.smlm.manifest.tags,
                                thumbnail: this.smlm.manifest.thumbnail,
                              },
                              citeAs: this.smlm.manifest.citeAs,
                              license: this.smlm.manifest.license,
                              hash: this.smlm.manifest.hash,
                              tags: ['#smlm'],
                              metadata:{}
                             }
          console.log(file_props)
          if(this.smlm.manifest.format_version != manifest_template.format_version){
              overwrite = true
              console.log('format version upgrade, overwriting...', this.smlm.manifest.format_version, '-->', manifest_template.format_version)
          }
          // check if tags changed
          console.log(this.smlm.manifest.tags, this.tags)
          if(this.smlm.manifest.tags.length == this.tags.length){
             for(let i=0;i<this.smlm.manifest.tags.length;i++){
               if(this.tags.indexOf(this.smlm.manifest.tags[i])==-1){
                 overwrite = true
                 break
               }
             }
          }
          else{
             overwrite = true
          }
          this.getUploadUrl(file_props, overwrite).then((res)=>{
            const signedUrl = res.url;
            const fileKey = res.key;
            if((!signedUrl || signedUrl=== null) && fileKey){
              console.log('file already uploaded')
              resolve()
              // this.api.show("The same file has already been uploaded.", 4000)
              return
            }
            this.smlm.save(this.updateStatus).then((file)=>{
              this.running = false
              this.uploadFile(file, file_props, fileKey, signedUrl).then((fileKey)=>{
                this.api.show('uploaded')
                resolve()
              }).catch((e)=>{
                console.error(e)
                this.api.show(e)
                reject(e)
              })
            }).catch((e)=>{
              console.error(e)
              this.api.show(e)
              reject(e)
            })
          }).catch((e)=>{
            console.error(e)
            this.api.show(e)
            reject(e)
          })
        }
        else{
          console.log('already uploaded')
          resolve()
        }
      })
    },
    downloadSmlmFile(){
      // if(this.selected_file_name.endsWith('.smlm')){
      //   saveAs(this.selected_file, this.selected_file_name);
      // }
      // else{
        // close render worker for memory
        if(this.renderWorker){
          this.renderWorker.terminate()
          this.renderWorker = null
        }
        this.smlm.save(this.updateStatus).then((file)=>{
           this.running = false
           let filename = file.name
           if(!file.name.endsWith('.smlm') && !file.name.endsWith('.zip')){
             filename = file.name + '.smlm'
           }
           saveAs(file, filename);
        }).catch((e)=>{
          this.api.show(e)
        })
      // }

    },
    getUploadUrl(file_props, overwrite){
      return new Promise((resolve, reject) => {
        if(!this.store.signed_in || !this.store.session){
          this.api.showLogin()
          this.api.show("please login or signup with your email.")
          reject('please login or signup with your email.')
        }
        console.log(file_props)
        this.store.session.call("org.imod.user.files.get_upload_url", [file_props, overwrite], {}, {disclose_me: true}).then((res)=>{
          resolve(res)
        }).catch((reason)=>{
            console.log('error', reason)
            if(reason.args){
              this.api.show("error occured "+reason.args[0], 5000)
            }
            else{
              this.api.show("error occured "+reason.toString(), 5000)
            }
            reject(reason.args)
        });
      })
    },
    uploadFile(file, file_props, fileKey, signedUrl){
      return new Promise((resolve, reject) => {
          const metadata = file_props['metadata'] || {}
          const amz_metadata = {}
          for(let k in metadata){
            if(metadata[k].constructor === Array){
              amz_metadata['x-amz-meta-' + k] = metadata[k].join()
            }
            else{
              amz_metadata['x-amz-meta-' + k] = metadata[k]? metadata[k].toString():''
            }
          }
          const headers = {'Content-Type': file.type}
          Object.assign(headers, amz_metadata)
          var options = {
            headers: headers,
            onUploadProgress: (progressEvent) => {
              this.running_progress = Math.round(1.0 * progressEvent.loaded / file.size * 100.0)
              this.running_status = "uploading your smlm file to our secured storage, size: "+Math.round(file.size/1000000)+"MB, " + this.running_progress + "% uploaded."
            }
          };
          this.running = true
          this.running_progress = 0
          this.running_status = "uploading to our secured storage..."
          console.log("upload to ", signedUrl);
          axios.put(signedUrl, file, options).then((result) => {
            this.running = false
            console.log('data uploaded, finishing')
            this.store.session.call("org.imod.user.files.finish_upload", [fileKey, {name:file.name, type:file.type, size:file.size}], {}, {disclose_me: true}).then((res2)=>{
              this.api.show("data uploaded.", 4000)
              console.log('finished data upload')
              resolve(fileKey)
            }).catch((err)=>{

              console.error(err)
              this.api.show("upload failed, please try again.", 5000)
              reject(err)
            })
          }).catch((err) => {
            console.error(err)
            this.api.show("upload failed, please check your s3 configuration.", 5000)
            this.running = false
            reject(err)
          });

      })
    },
    updateFPS(status){
        this.fps = status.fps
        this.ppf = status.ppf
        // console.log(this.fps);
    },
    switch3DView(use_3d){
      this.$forceUpdate()
      if(use_3d){
        if(this.options.tableDict.z){
          if(!this.render3d_loaded){
            load3DViewer(document.getElementById("histogram_canvas_3d"), this.updateFPS)
            this.render3d_loaded = true
          }
          this.plotHist()
        }
        else{
          this.api.show("no data found on z dimension.", 4000)
          this.use_3d = false
        }
      }
      else{
        this.plotHist()
      }
    },
    update_selected_filter(){
      this.filter_expression = ""
      for(var i=0;i<this.options.headers.length;i++){
        if(this.filter_ranges[this.options.headers[i]][1] != this.filter_ranges[this.options.headers[i]][0]){
          if(this.filter_ranges[this.options.headers[i]][0]!=this.options.min[this.options.headers[i]]){
            this.filter_expression += this.options.headers[i] + ">=" + this.filter_ranges[this.options.headers[i]][0] + ' and '
          }
          if(this.filter_ranges[this.options.headers[i]][1]!=this.options.max[this.options.headers[i]]){
            this.filter_expression += this.options.headers[i] + "<=" + this.filter_ranges[this.options.headers[i]][1] + ' and '
          }
        }
      }
      if(this.filter_expression.slice(-5) == ' and '){
        this.filter_expression = this.filter_expression.slice(0, -5)
      }
      console.log('generated filter expression:', this.filter_expression )
      this.plotHist()
    },
    reset_filters(){
      for(var i=0;i<this.options.headers.length;i++){
        this.filter_ranges[this.options.headers[i]] = [Math.round(this.options.min[ this.options.headers[i]]), Math.round(this.options.max[ this.options.headers[i]]) ]
      }
      // select frame by default
      if(this.options.headers.indexOf('frame')>=0){
        this.switch_selected_filter('frame')
      }
      this.filter_expression = ''
      this.hist_render2d_config.brightness = 100
      this.plotHist()
    },
    switch_selected_filter(filter_name){
      console.log(filter_name)
      // if(filter_name && this.selected_filter && this.selected_filter == filter_name){
      //   this.selected_filter = null
      //   return
      // }
      // else{
        this.selected_filter = filter_name
      // }
      if(!this.filter_ranges[filter_name]){
        for(var i=0;i<this.options.headers.length;i++){
          this.filter_ranges[this.options.headers[i]] = [this.options.min[ this.options.headers[i]], this.options.max[ this.options.headers[i]] ]
        }
      }
      this.selected_filter_range = this.filter_ranges[filter_name]
      this.selected_filter_min = this.options.min[filter_name]
      this.selected_filter_max = this.options.max[filter_name]
      console.log(this.filter_ranges)
    },
    updateRenderStatus(status){
      this.rendering_progress = status.rendering_progress || this.rendering_progress
      this.rendering_status = status.rendering_status || this.rendering_status
      this.rendering = status.rendering || this.rendering
    },
    plotHist(options){
      this.show_anet_output = false
      this.current_render2d_config = this.hist_render2d_config
      options = options || this.options
      console.log(options)
      if(!options.tableDict || options.headers.length<=0 || options.tableArrays.length<=0){
        console.log({canvas_img_data:canvas_img_data, options:options})
        console.log('rendering error.')
        this.api.show('something went wrong, data is not loaded.', 5000)
        return
      }
      return new Promise((resolve, reject) => {
        this.rendering_progress = 0
        this.rendering_status = 'rendering'
        this.rendering = true
        // onlocationinfo(e.data);
        var pixel_size = this.pixel_size || 20
        options.pixel_size = pixel_size
        this.pixel_size = pixel_size
        // for(var i=0;i<options.headers.length;i++){
        //   this.filter_ranges[headers[i]] = [options.min[ options.headers[i]], options.max[ options.headers[i]] ]
        // }
        var escaped_headers= []
        for(var i=0;i<options.headers.length;i++){
          escaped_headers[i] = options.headers[i];
        }
        this.filter_tooltip = 'you can use these variables in your filter: ' + escaped_headers.join(', ') + ' , use random() to do random sampling.'
        console.log('max_frame_number', options.max.frame, 'min_frame_number', options.min.frame)

        this.filter_ranges.x = this.filter_ranges.x || [options.min.x, options.max.x]
        this.filter_ranges.y = this.filter_ranges.y || [options.min.y, options.max.y]

        options.xy_range = []
        options.xy_range[0] = Math.round(this.filter_ranges.x[0]/pixel_size)
        options.xy_range[1] = Math.round(this.filter_ranges.x[1]/pixel_size)
        options.xy_range[2] = Math.round(this.filter_ranges.y[0]/pixel_size)
        options.xy_range[3] = Math.round(this.filter_ranges.y[1]/pixel_size)

        this.histogram_width = Math.min(options.xy_range[1] - options.xy_range[0], 2560)
        this.histogram_height = Math.min(options.xy_range[3] - options.xy_range[2], 2560)
        options.histogram_width = this.histogram_width
        options.histogram_height = this.histogram_height
        options.filter_expression = this.filter_expression
        options.offset_mode = this.offset_mode
        console.log('filtering...', this.offset_mode)
        const options_ = {
          file_name: options.file_name,
          file_size: options.file_size,
          file_id: options.file_id,
          tableDict: options.tableDict,
          rows: options.rows,
          xy_range: options.xy_range,
          offset_mode: this.offset_mode,
          histogram_width: options.histogram_width,
          histogram_height: options.histogram_height,
          pixel_size: options.pixel_size,
          filter_expression: options.filter_expression,
          min: options.min,
          max: options.max
        }
        var filterWorker = this.filterWorker;
        if(!filterWorker){
          if (typeof (Worker) !== "undefined") {
              filterWorker = new Worker("static/js/AsyncFilter.js")
              this.filterWorker = filterWorker
          } else {
              console.log("Web Worker not available")
              this.api.show("Web Worker not available")
              return
          }
        }

        filterWorker.onerror = (e) => {
          console.log('filterWorker went wrong: ', e)
        }
        filterWorker.onmessage = (e) => {
          // console.log(e)
          if(e.data.progress){
            this.rendering = true
            // console.log('rendering ', e.data.progress)
            this.rendering_progress = Math.round(e.data.progress)
          }
          if(e.data._options){
            if(e.data._options.tableDict && options.tableDict){
              for(let k in e.data._options.tableDict){
                options.tableDict[k] = e.data._options.tableDict[k]
              }
            }
            if(e.data._options.isFiltered){
              options.isFiltered = e.data._options.isFiltered
            }
          }
          if(e.data.finished){
            console.log('finished filtering')
            options_.isFiltered = e.data.isFiltered
            options_.filteredRows = e.data.filteredRows
            options_.frameNumber = e.data.frameNumber
            this.localizationNumber = options_.filteredRows
            this.frameNumber = options_.frameNumber

            console.log(options_)
            if(this.use_3d){
              this.render3d(options_).then(()=>{resolve()})
            }
            else{
              this.render2d(options_).then(()=>{resolve()})
            }
            this.current_displaying = 'hist'
          }
        }
        this.rendering_status = "filtering..."
        const transferables = []
        for(let k in options_.tableDict){
          transferables.push(options_.tableDict[k].buffer)
        }
        filterWorker.postMessage({options:options_}, transferables)
      })
    },
    render2d(options_){
      return new Promise((resolve, reject) => {
        var renderWorker = this.renderWorker;
        if(!renderWorker){
          if (typeof (Worker) !== "undefined") {
              renderWorker = new Worker("static/js/AsyncRenderer.js")
              this.renderWorker = renderWorker
          } else {
              console.log("Web Worker not available")
              this.api.show("Web Worker not available")
              return
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = this.histogram_width
        canvas.height = this.histogram_height
        var ctx = canvas.getContext("2d");
        // ctx.fillStyle="#000000";
        // ctx.fillRect(0, 0, this.histogram_width, this.histogram_height);
        var canvas_img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        renderWorker.onerror = (e) => {
          console.log('renderWorker went wrong: ', e)
          this.rendered = true
          this.rendering = false
          this.rendering_status = 'error ocurred: ' + e.data.message
          this.api.show(e.data.message, 5000)
          if(e.data.message.includes("fillter expression")){
            this.show_filter = true
          }
          this.renderWorker = null
          renderWorker.terminate()
          //this.rendering_progress = 100
          reject()
        }
        renderWorker.onmessage = (e) => {
          if(e.data.progress){
            this.rendering = true
            // console.log('rendering ', e.data.progress)
            this.rendering_progress = Math.round(e.data.progress)
          }
          // if(e.data.sending){
          //   this.rendering_status = "preparing histogram"
          // }
          if(e.data._options){
            if(e.data._options.tableDict && options_.tableDict){
              for(let k in e.data._options.tableDict){
                options_.tableDict[k] = e.data._options.tableDict[k]
              }
            }
            if(e.data._options.isFiltered){
              options_.isFiltered = e.data._options.isFiltered
            }
          }
          if(e.data.finished){
            console.log('finished rendering')

            if(this.screenWidth>800){
              this.rendering_status =  options_.filteredRows + ', file:' +this.options.file_name+').'
              if(this.histogram_width<options_.xy_range[1] - options_.xy_range[0] ||this.histogram_height<options_.xy_range[3] - options_.xy_range[2] ){
                this.rendering_status = 'histogram rendered (truncated to '+this.histogram_width+'x'+ this.histogram_height + ', loc.:'+this.rendering_status
              }
              else{
                this.rendering_status = 'histogram rendered (loc.:' +this.rendering_status
              }
            }
            else{
              this.rendering_status = 'rendered '
            }
            this.rendering_progress = 100
            ctx.putImageData(e.data.canvas_img_data, 0, 0);
            this.rendering = false
            this.rendered = true
            // this.current_task.histogram = ret.hist
            this.histogram_image = canvas.toDataURL("image/png")
            this.render_canvas(e.data.canvas_img_data, 100)
            // renderWorker.terminate()
            resolve(this.histogram_image)

          }
          else if(e.data.error){
            console.log('error during rendering ')
            this.rendered = true
            this.rendering = false
            this.rendering_status = 'error ocurred: ' + e.data.message
            this.api.show(e.data.message, 5000)
            if(e.data.message.includes("fillter expression")){
              this.show_filter = true
            }
            this.renderWorker = null
            renderWorker.terminate()
            //this.rendering_progress = 100
            reject()

          }

        }
        this.rendering_status = "rendering..."
        console.log('rendering in canvas')
        const transferables = []
        for(let k in options_.tableDict){
          transferables.push(options_.tableDict[k].buffer)
        }
        if(options_.isFiltered){
          transferables.push(options_.isFiltered.buffer)
        }
        renderWorker.postMessage({canvas_img_data:canvas_img_data, options:options_}, transferables)
      })
    },
    render3d(options){
      return new Promise((resolve, reject) => {
        try {
          show3DLocalizations(options, this.updateRenderStatus)
        } catch (e) {
          reject('3d rendering error')
          console.error(e)
          this.rendering_status = "something went wrong during rendering."
        } finally {
          this.rendering = false
          this.rendered = true
          resolve()
        }
      })
    },
    render_canvas(imageData, brightness){
      this.rendered = true
      let map;
      brightness = brightness || 1;
      if(this.leafletMap){
        // this.leafletMap.off()
        // this.leafletMap.remove()
        map = this.leafletMap
      }
      else{
        map = L.map('leaflet_histogram', {
         minZoom: 1,
         maxZoom: 4,
         center: [0, 0],
         zoom: 1,
         crs: L.CRS.Simple
       });
       this.leafletMap = map
      }

     const data2img = (imageData)=>{
       // create the slippy map
       Filters.filterImage( imageData, Filters.brightness, 0, brightness)
       if(this.use_lut) Filters.filterImage( imageData, Filters.lut, hot_lut )
       var canvas = document.createElement("canvas");
       canvas.width = this.histogram_width;
       canvas.height = this.histogram_height;
       // Copy the image contents to the canvas
       var ctx = canvas.getContext("2d");
       ctx.putImageData(imageData, 0, 0)

       var img = canvas.toDataURL("image/png")
       return img
     };

     const updateMap = (imageData) => {
       this._canvas_data = imageData
       // dimensions of the image
       var w = this.histogram_width,
           h = this.histogram_height,
           url = data2img(imageData);

       this.export_histogram_png = url.replace("image/png", "application/octet-stream")
       // calculate the edges of the image, in coordinate space
       if(this.screenWidth<=800){
         map.options.minZoom = -2;
       }
       else{
         map.options.minZoom = -1;
       }
       var southWest = map.unproject([0, h], map.options.zoom);
       var northEast = map.unproject([w, 0], map.options.zoom);
       var bounds = new L.LatLngBounds(southWest, northEast);

       // add the image overlay,
       // so that it covers the entire map
       if(this._canvas_layer){
         map.removeLayer(this._canvas_layer)
       }
       this._canvas_layer = L.imageOverlay(url, bounds)
       this._canvas_layer.addTo(map);
       // tell leaflet that the map is exactly as big as the image
       map.setMaxBounds(bounds);
       setTimeout(() => {
         this.leafletMap.invalidateSize();
         this.$forceUpdate()
       }, 800)

     }
     if(!imageData){
       var image = new Image();
       image.onload = ()=>{
           var canvas = document.createElement("canvas");
           canvas.width = image.width;
           canvas.height = image.height;
           var ctx = canvas.getContext("2d");
           ctx.drawImage(image, 0, 0);
           imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
           updateMap(imageData)
           if(this.$refs['brightness-slider'])   this.$refs['brightness-slider'].refresh()
       };
       image.onerror = ()=>{
         this.rendering = false
         this.rendered = true
       }
       image.src = this.histogram_image
     }
     else{
       updateMap(imageData)
     }
    },
    render_canvas2(imgData, brightness){
       this.rendering_status = "almost done, showing on the canvas..."
       // this.rendering = true
       // this.rendered = false
       brightness = brightness || 0
       console.log('adjust brightness', brightness)
       var himage = this.histogram_image
       var canvas = document.getElementById("histogram_canvas");
       var ctx = canvas.getContext("2d");
       var image = new Image();
       var use_lut = this.use_lut;
       image.onload = ()=>{
           ctx.drawImage(image, 0, 0);
           var h = canvas.height;
           var w = canvas.width;
           imgData = imgData || ctx.getImageData(0, 0, w, h);
           if(!brightness){
             var p = Filters.min_max(imgData)
             if(p.max==0)
              brightness = 1.0
             else
              brightness=(255/p.max);
             this.current_render2d_config.brightness = parseInt(brightness)
           }
           // else{
           //   this.current_render2d_config.brightness = parseInt(brightness)
           // }
           Filters.filterImage( imgData, Filters.brightness, 0, brightness)
           if(this.use_lut) Filters.filterImage( imgData, Filters.lut, hot_lut )
           ctx.putImageData(imgData, 0, 0)
           var imageCanvas = document.getElementById("histogram_canvas").toDataURL("image/png")
                       .replace("image/png", "application/octet-stream")
           this.export_histogram_png = imageCanvas
           console.log('prepared url for image download')
           this.rendering_progress = 100
           this.rendering_status = "ready."
           this.rendering = false
           this.rendered = true
           if(this.$refs['brightness-slider'])   this.$refs['brightness-slider'].refresh()
       };
       image.onerror = ()=>{
         this.rendering = false
         this.rendered = true
       }
       image.src = himage

    },
    // download_image(image, filename){
    //
    //   var image_data = atob(image.split(',')[1]);
    //   var arraybuffer = new ArrayBuffer(image_data.length);
    //   var view = new Uint8Array(arraybuffer);
    //   for (var i=0; i<image_data.length; i++) {
    //       view[i] = image_data.charCodeAt(i) & 0xff;
    //   }
    //   var img = UPNG.decode(arraybuffer)
    //
    //   var im1 = new Uint16Array(new ArrayBuffer(2560*2560*2));
    //   var im2 = new Uint16Array(new ArrayBuffer(2560*2560*2));
    //
    //   function swap16(val) {
    //       return ((val & 0xFF) << 8)
    //              | ((val >> 8) & 0xFF);
    //   }
    //
    //   for(var i=0;i<2560;i++){
    //     for(var j=0;j<2560;j++){
    //       im1[j*2560+i] = swap16(j)
    //       im2[j*2560+i] = swap16(i)
    //     }
    //   }
    //   console.log([im1, im2])
    //   var imgFile = UPNG.encodeLL([im1.buffer, im2.buffer], 2560, 2560, 1, 0, 16, [0, 0]) //UPNG.encode([img.data.buffer], 2560, 2560, 0) //UPNG.encodeLL([im1, im2], 2560, 2560, 1, 0, 16, [0,0])
    //
    //   try {
    //       // This is the recommended method:
    //       var blob = new Blob([imgFile], {type: 'application/octet-stream'});
    //   } catch (e) {
    //       // The BlobBuilder API has been deprecated in favour of Blob, but older
    //       // browsers don't know about the Blob constructor
    //       // IE10 also supports BlobBuilder, but since the `Blob` constructor
    //       //  also works, there's no need to add `MSBlobBuilder`.
    //       var bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder);
    //       bb.append(imgFile);
    //       var blob = bb.getBlob('application/octet-stream'); // <-- Here's the Blob
    //   }
    //   var a = document.createElement("a");
    //       document.body.appendChild(a);
    //       a.style = "display: none";
    //
    //   // Use the URL object to create a temporary URL
    //   var url = (window.webkitURL || window.URL).createObjectURL(blob);
    //   a.href = url;
    //   a.download = filename;
    //   a.click();
    //   window.URL.revokeObjectURL(url);
    // },

    download_image(image, filename){
        // atob to base64_decode the data-URI
        var image_data = atob(image.split(',')[1]);
        // Use typed arrays to convert the binary data to a Blob
        var arraybuffer = new ArrayBuffer(image_data.length);
        var view = new Uint8Array(arraybuffer);
        for (var i=0; i<image_data.length; i++) {
            view[i] = image_data.charCodeAt(i) & 0xff;
        }
        try {
            // This is the recommended method:
            var blob = new Blob([arraybuffer], {type: 'application/octet-stream'});
        } catch (e) {
            // The BlobBuilder API has been deprecated in favour of Blob, but older
            // browsers don't know about the Blob constructor
            // IE10 also supports BlobBuilder, but since the `Blob` constructor
            //  also works, there's no need to add `MSBlobBuilder`.
            var bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder);
            bb.append(arraybuffer);
            var blob = bb.getBlob('application/octet-stream'); // <-- Here's the Blob
        }
        var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";

        // Use the URL object to create a temporary URL
        var url = (window.webkitURL || window.URL).createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.md-app-scroller{
  z-index: -1;
}
#histogram_map { height: 400px;}
#leaflet_histogram {
  z-index: 12;
  position: relative;
  width: 100%;
  height: 100%;
}
.canvas-container{
  z-index: 10;
  position: relative;
  height: 100%;
  width: 100%;
}
.slider-toolbar{
  z-index: 30;
}
.render-info {
  z-index: 20;
  text-align: right;
  color: #de199e;
  position: absolute;
  top: 8px;
  right: 45px;
  margin-top: 8px;
}
#histogram_canvas_3d {
  z-index: 13;
	position: relative;
	top: 0;
	left: 0;
}
#gui-webgl {
  z-index: 14;
  position: fixed;

}

.md-list-item-content{
  display: inline-flex;
}
.md-list-item-content .md-switch{
  margin-left: 12px;
}

.dropbox {
  outline: 2px dashed grey; /* the dash box */
  outline-offset: -10px;
  background: lightcyan;
  color: dimgray;
  padding: 10px 10px;
  min-height: 200px; /* minimum height */
  position: relative;
  cursor: pointer;
}

.input-file {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 200px;
  position: absolute;
  cursor: pointer;
}

.dropbox:hover {
  background: lightblue; /* when mouse over to the drop zone, change color */
}

.dropbox p {
  font-size: 1.2em;
  text-align: center;
  padding: 50px 0;
}

.thumbnail-img{
   text-align: center;
   border: 1px solid #ddd; /* Gray border */
   border-radius: 4px;  /* Rounded border */
   padding: 4px; /* Some padding */
   width: 192px;  /* Set a small width */
}

#repository-button{
  text-transform: none;
}

.files-item-1{
  color: #448aff;
  font-weight: 400;
}

.files-item-1-selected{
  color: #448aff;
  font-weight: 800;
}

.files-item-2{
  color: #6c44ff;
  font-weight: 400;
}

.files-item-2-selected{
  color: #6c44ff;
  font-weight: 800;
}

.md-empty-state {
  position: relative;
  /* top: 39%;
  left: 50%;
  transform: translate(-50%, -50%); */
  max-width: 100%;
  width: 100%;
}

.viewer {
  height: 100%;
}


#faq-button{
  text-transform: none;
}

.faq-card{
  width: 80%;
}

</style>
