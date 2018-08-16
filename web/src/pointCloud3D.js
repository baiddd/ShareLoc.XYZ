var shaderScripts = {"shader-particle-renderer-vs":
  {type:"x-shader/x-vertex",
  source: `#ifdef GL_ES
  precision mediump float;
  #endif
  attribute vec2 uv;

  uniform sampler2D sampler_particles;

  uniform vec2 viewSize;
  uniform vec4 scale;
  uniform vec4 color1;
  uniform vec2 clipX;
  uniform vec2 clipY;
  uniform vec2 clipZ;

  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;

  uniform float fov;
  uniform vec3 camera;
  uniform float pointSizeMin;
  uniform float pointSizeMax;

  varying vec4 col;
  varying float alphaFactor;

  void main() {
  	vec4 pos = texture2D(sampler_particles, uv);
  	bool isVisible = clipX.x - 0.5 <= pos.x && pos.x <= clipX.y - 0.5 && clipY.x - 0.5 <= pos.y && pos.y <= clipY.y - 0.5 && clipZ.x - 0.5 <= pos.z && pos.z <= clipZ.y - 0.5;
  	pos.xyz += -vec3(clipX.x + clipX.y, clipY.x + clipY.y, clipZ.x + clipZ.y)*0.5 + 0.5;
  	pos.xyz *= scale.xyz;

  	float distance = length(camera-(modelViewMatrix * pos).xyz);
  	gl_PointSize = scale.w*fov/distance*viewSize.y/2048.;

  	alphaFactor = 1.;
  	if(gl_PointSize < 1.){
  		alphaFactor = max(gl_PointSize, 1./16.);
  	}

  	col = color1;

  	pos.w = 1.;
  	gl_Position = projectionMatrix  * modelViewMatrix * pos;

  	if(!isVisible){
  		col.a = 0.;
  	}}`
  },
  "shader-vs":
    {type:"x-shader/x-vertex",
    source: `#ifdef GL_ES
    precision mediump float;
    #endif
    attribute vec3 aPos;
    attribute vec2 aTexCoord;
    varying   vec2 uv;
    varying vec2 uv_orig;
    void main(void) {
    	 gl_Position = vec4(aPos, 1.);
    	 uv = aTexCoord;
    	 uv_orig = uv;
    }`
  },
  "shader-particle-renderer-fs":
    {type:"x-shader/x-fragment",
    source: `#ifdef GL_ES
    precision mediump float;
    #endif
    varying vec4 col;
    varying float alphaFactor;

    void main() {
    	gl_FragColor = col;
    	gl_FragColor.a *= alphaFactor;
    }`
  }
}


function getShader(gl, id) {
  var shaderScript = shaderScripts[id];
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex")
    shader = gl.createShader(gl.VERTEX_SHADER);
  else
    return null;
  gl.shaderSource(shader, shaderScript.source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
    alert("error compiling shader '" + id + "'\n\n" + gl.getShaderInfoLog(shader));
  return shader;
}

var gl;
var ext;

var prog_render_particles;

var FBO_particles;

// particle position buffer in a texture
var texture_particles;

var particlesWidth = 512;
var particlesHeight = 512;

var particleCount = 64 * 64 * 64;// can also be set to lower than particlesWidth * particlesHeight

// main animation loop vars

var sizeX = 1024; // texture size (must be powers of two, must also be greater than the particles texture *?*)
var sizeY = 512;

var viewX = sizeX; // viewport size (ideally exactly the texture size)
var viewY = sizeY;

var delay = 1 / 60;
var it = 1; // main loop buffer toggle
var frame = 0; // frame counter (to be resetted every 1000ms)
var framecount = 0; // not resetted
var fps;
var time;
var timer;
var starttime = new Date().getTime();

var particleBuffer;

//Threejs setup
var camera, scene, group, controls;
var gui, scopeParams;

var update_webgl_status_callback;
var canvas;
var ScopeParams = function () {
  this.scaleX = 1;
  this.scaleY = 1;
  this.scaleZ = 1;
  this.pointSize = 1;

  this.distance = 4.0;
  this.fov = 16.;
  this.pointSizeMin = 0;
  this.pointSizeMax = 12;
}

function onViewportChanged(){
  viewX = window.innerWidth;
  viewY = window.innerHeight;
  canvas.width = viewX;
  canvas.height = viewY;

  var angle = 75;
  var aspect = viewX / viewY;
  var near = .1;
  var far = 10000;

  camera = new THREE.PerspectiveCamera(angle, aspect, near, far);
  scene = new THREE.Scene();
  group = new THREE.Object3D();
  scene.add(camera);
  scene.add(group);
  camera.lookAt(group);

  // Camera projection matrix

  updateMatrices();

  controls = new THREE.TrackballControlsWithPropagation(camera, canvas);

  group.position.set(0, 0, 0);

  camera.position.set(0, 0, scopeParams.distance);

  camera.fov = scopeParams.fov;
  camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, window.innerWidth / window.innerHeight, camera.near, camera.far);

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  controls.dynamicDampingFactor = 0.15;
}

var rerender = false;
function setRerender() {
  totalNumberOfChunks = 0;
  scopeParams['Total # of locations'] = 0;
  for(var i = 0; i < fileIDs.length; i++){
    if(scopeParams['active ' + i] && scopeParams['alpha ' + i] > 0){
      totalNumberOfChunks += files[fileIDs[i]].locations.numChunks;
      scopeParams['Total # of locations'] += files[fileIDs[i]].locations.rows;
    }
    var color = scopeParams['color ' + i];
    if(typeof(color) == "string"){
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      scopeParams['color ' + i] = [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ];
    }
  }
  rerender = true;
}

export function load3DViewer(canvasElement, update_callback) {
  update_webgl_status_callback = update_callback;
  scopeParams = new ScopeParams();
  // gui = new dat.GUI();
  gui = new dat.GUI({ autoPlace: false });
  var customContainer = document.getElementById('gui-webgl');
  customContainer.appendChild(gui.domElement);
  scopeParams['Total # of locations'] = 0;

  scopeParams['reset scale'] = function(){
    scopeParams['x'] = 1;
    scopeParams['y'] = 1;
    scopeParams['z'] = 1;
    scopeParams['point size'] = 3;
    rerender = true;
  };

  scopeParams['reset scale']();
  var scaleFolder = gui.addFolder('Scale (x10)');
  scaleFolder.add(scopeParams, 'x', 0, 10).listen().onChange(setRerender);
  scaleFolder.add(scopeParams, 'y', 0, 10).listen().onChange(setRerender);
  scaleFolder.add(scopeParams, 'z', 0, 10).listen().onChange(setRerender);
  scaleFolder.add(scopeParams, 'point size', 0, 20).listen().onChange(setRerender);
  scaleFolder.add(scopeParams, 'reset scale');

  scopeParams['reset clipping'] = function(){
    scopeParams['x min'] = 0;
    scopeParams['x max'] = 1;
    scopeParams['y min'] = 0;
    scopeParams['y max'] = 1;
    scopeParams['z min'] = 0;
    scopeParams['z max'] = 1;
    rerender = true;
  };
  scopeParams['reset clipping']();
  var clippingFolder = gui.addFolder('Clipping');
  clippingFolder.add(scopeParams, 'x min', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'x max', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'y min', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'y max', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'z min', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'z max', 0, 1).listen().onChange(setRerender);
  clippingFolder.add(scopeParams, 'reset clipping');

  gui.add(scopeParams, 'Total # of locations').listen();

  canvas = canvasElement; //document.getElementById("c");
  try {
    gl = canvas.getContext("webgl", { depth: false, preserveDrawingBuffer: true });
  } catch (e) {
  }
  if (!gl) {
    alert("Meh! Y u no support WebGL !?!");
    return;
  }

  ["OES_texture_float"].forEach(function (name) {
    console.log("check " + name);
    try {
      ext = gl.getExtension(name);
    } catch (e) {
      alert(e);
    }
    if (!ext) {
      alert("Meh! Y u no support " + name + " !?!");
      return;
    }
    ext = false;
  });

  if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0) {
    alert("Meh! Y u no support vertex shader textures !?!");
    return;
  }


  files = [];
  fileIDs = [];

  document.addEventListener("orientationchange", window.onresize = onViewportChanged);
  window.addEventListener('DOMMouseScroll', mousewheel, false);
  window.addEventListener('mousewheel', mousewheel, false);

  onViewportChanged();

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

  var d = 1 / 512;
  var locationCoordsBuffer = new ArrayBuffer(512 * 512 * 16);
  locationCoordsBuffer.float32 = new Float32Array(locationCoordsBuffer);
  for(var i = 0; i < 512 ; i++){
    for(var j = 0; j < 512 ; j++){
      locationCoordsBuffer.float32[(i * 512 + j)*2 + 0] = d / 2 + j * d;
      locationCoordsBuffer.float32[(i * 512 + j)*2 + 1] = d / 2 + i * d;
    }
  }
  var attributesBuffer = new ArrayBuffer(512 * 512 * 16);
  attributesBuffer.float32 = new Float32Array(attributesBuffer);

  FBO_particles = gl.createFramebuffer();
  texture_particles = createAndBindParticleTexture(attributesBuffer.float32, FBO_particles);

  var aParticleLoc = 1;
  prog_render_particles = createAndLinkParticleRenderer(aParticleLoc);

  gl.useProgram(prog_render_particles);
  gl.uniform1i(gl.getUniformLocation(prog_render_particles, "sampler_particles"), 0);

  gl.enableVertexAttribArray(aParticleLoc);
  particleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, locationCoordsBuffer.float32, gl.STATIC_DRAW);
  gl.vertexAttribPointer(aParticleLoc, 2, gl.FLOAT, false, 8, 0);

  timer = setInterval(fr, 1000);
  time = new Date().getTime() - starttime;

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.blendEquation(gl.FUNC_ADD);
  gl.clearColor(0, 0, 0, 1);

  anim();
}

function createAndLinkProgram(fsId) {
  var program = gl.createProgram();
  gl.attachShader(program, getShader(gl, "shader-vs"));
  gl.attachShader(program, getShader(gl, fsId));
  gl.linkProgram(program);
  return program;
}

function createAndLinkParticleRenderer(aParticleLoc) {
  var program = gl.createProgram();
  gl.attachShader(program, getShader(gl, "shader-particle-renderer-vs"));
  gl.attachShader(program, getShader(gl, "shader-particle-renderer-fs"));
  gl.bindAttribLocation(program, aParticleLoc, "uv"); // can't use getAttribLocation later so we must bind before linking
  gl.linkProgram(program);
  return program;
}

function createAndBindTexture(glPixels, scale, fbo, filter) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeX / scale, sizeY / scale, 0, gl.RGBA, gl.FLOAT, glPixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  checkFrameBuffer();
  return texture;
}

function createAndBindParticleTexture(glPixels, fbo) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particlesWidth, particlesHeight, 0, gl.RGBA, gl.FLOAT, glPixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  checkFrameBuffer();
  return texture;
}

var newLocations = false;
function onlocations() {
  newLocations = true;
}

function loadNewLocationTextures() {
  if (newLocations) {
    // assume only one file has been loaded and it's the last in the list of IDs
    var locations = files[fileIDs[fileIDs.length-1]].locations;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture_particles);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_particles);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particlesWidth, particlesHeight, 0, gl.RGBA, gl.FLOAT, locations.stridedFloat32Arrays[1]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_particles, 0);

    setRerender();
  }
}

function checkFrameBuffer() {
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    console.log("Framebuffer, y u not completed yet!?");
    for (var i in gl) {
      if (typeof (gl[i]) == "number" && gl[i] == status) {
        console.log("-> " + i);
      }
    }
  }
}

function setUniforms(program) {
  gl.uniform2f(gl.getUniformLocation(program, "viewSize"), viewX, viewY);

  gl.uniform2f(gl.getUniformLocation(program, "aspect"), Math.max(1, viewX / viewY), Math.max(1, viewY / viewX));

  gl.uniform4f(gl.getUniformLocation(program, "scale"), scopeParams['x'], scopeParams['y'], scopeParams['z'], scopeParams['point size']);

  var minX = Math.min(scopeParams['x min'], scopeParams['x max']);
  var maxX = Math.max(scopeParams['x min'], scopeParams['x max']);
  gl.uniform2f(gl.getUniformLocation(program, "clipX"), minX, maxX);

  var minY = Math.min(scopeParams['y min'], scopeParams['y max']);
  var maxY = Math.max(scopeParams['y min'], scopeParams['y max']);
  gl.uniform2f(gl.getUniformLocation(program, "clipY"), minY, maxY);

  var minZ = Math.min(scopeParams['z min'], scopeParams['z max']);
  var maxZ = Math.max(scopeParams['z min'], scopeParams['z max']);
  gl.uniform2f(gl.getUniformLocation(program, "clipZ"), minZ, maxZ);

  gl.uniform1f(gl.getUniformLocation(program, "fov"), 1./Math.tan(scopeParams.fov/180*Math.PI));
  gl.uniform3f(gl.getUniformLocation(program, "camera"), 0, 0, scopeParams.distance);

  gl.uniform1i(gl.getUniformLocation(program, "sampler_particles"), 1);
}

var oldProjectionMatrixArray = new Float32Array(16);
var oldFov = 0;
var oldViewMatrixArray = new Float32Array(16);
var isStill = true; var wasStill = true;

function anim(t) {
  wasStill = isStill;
  isStill = true;
  for(var i = 0; i < 16; i++){
    isStill = isStill &&
      oldProjectionMatrixArray[i] - camera._projectionMatrixArray[i] == 0 &&
      oldViewMatrixArray[i] - camera._viewMatrixArray[i] == 0;
  }
  isStill = isStill && camera.fov == oldFov
  if(!isStill){
    oldFov = camera.fov;
    oldProjectionMatrixArray.set(camera._projectionMatrixArray);
    oldViewMatrixArray.set(camera._viewMatrixArray);
  }

  loadNewLocationTextures();

  controls.update();
  updateMatrices();

  renderParticles();

  if(t)
    throttle(t);

  requestAnimationFrame(anim);

  newLocations = false;

  frame++;
  framecount++;
}

var totalNumberOfChunks = 0;
var chunksPerAnimationFrame = 0;
var lastChunkRendered = -1;
var targetFps = 24;
var lastRenderTime = 0;

function throttle(t){
  var dt = t -lastRenderTime;
  lastRenderTime = t;
  if(isStill){
    return;
  }
  if(dt < 1000 / targetFps){
    chunksPerAnimationFrame+=0.25;
  }else{
    chunksPerAnimationFrame-=0.25;
  }
  chunksPerAnimationFrame = Math.max(chunksPerAnimationFrame, 0);
  chunksPerAnimationFrame = Math.min(chunksPerAnimationFrame, totalNumberOfChunks);
}

function renderParticles() {
  gl.viewport(0, 0, viewX, viewY);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  var newMove = wasStill && !isStill;
  if(rerender || !isStill || newLocations){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.flush();
    lastChunkRendered = -1;
  }
  if(isStill && lastChunkRendered == -1 && !newLocations && !rerender || totalNumberOfChunks == 0){
    rerender = false;
    return;
  }
  rerender = false;

  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.useProgram(prog_render_particles);
  setUniforms(prog_render_particles);

  gl.uniformMatrix4fv(gl.getUniformLocation(prog_render_particles, "projectionMatrix"), false, camera._projectionMatrixArray);
  gl.uniformMatrix4fv(gl.getUniformLocation(prog_render_particles, "modelViewMatrix"), false, camera._viewMatrixArray);

  gl.enable(gl.BLEND);

  gl.activeTexture(gl.TEXTURE1);
  var chunk = 0;
  loopFiles:
  for(var i = 0; i < fileIDs.length; i++){
    var file = files[fileIDs[i]];
    var lastChunk = file.locations.numChunks - 1;
    var color = scopeParams['color ' + i];
    var alpha = scopeParams['alpha ' + i];
    var active = scopeParams['active ' + i] && alpha > 0;
    if(!active){
      continue loopFiles; // skip the chunks of this file
    }
    gl.uniform4f(gl.getUniformLocation(prog_render_particles, "color1"), color[0]/255, color[1]/255, color[2]/255, alpha);
    for(var j = 0; j < file.locations.numChunks; j++){
      if(chunk > lastChunkRendered){
        if(chunk <= lastChunkRendered + chunksPerAnimationFrame && chunk < totalNumberOfChunks){
          var locationTexture = file.locations.textures[j];
          gl.bindTexture(gl.TEXTURE_2D, locationTexture);
          var pointCount = file.locations.bufferLength;
          if(j == lastChunk){
            pointCount = file.locations.rows - file.locations.bufferLength * lastChunk
            lastChunkRendered = -1;
          }
          gl.drawArrays(gl.POINTS, 0, pointCount);
        }else{
          lastChunkRendered = chunk - 1;
          break loopFiles; // get out of both for loops
        }
      }
      chunk++;
    }
  }
  gl.disable(gl.BLEND);
  gl.flush();
}

function updateMatrices() {
  scene.updateMatrixWorld();
  camera.matrixWorldInverse.getInverse(camera.matrixWorld);

  if (!camera._viewMatrixArray)
    camera._viewMatrixArray = new Float32Array(16);
  camera.matrixWorldInverse.flattenToArray(camera._viewMatrixArray);

  if (!camera._projectionMatrixArray)
    camera._projectionMatrixArray = new Float32Array(16);
  camera.projectionMatrix.flattenToArray(camera._projectionMatrixArray);

  if (!group.__webglInit) {
    group._modelViewMatrix = new THREE.Matrix4();
    group._objectMatrixArray = new Float32Array(16);
    group._modelViewMatrixArray = new Float32Array(16);
  }

  group.matrixWorld.flattenToArray(group._objectMatrixArray);
  group._modelViewMatrix.multiplyToArray(camera.matrixWorldInverse, group.matrixWorld, group._modelViewMatrixArray);
}

var colors = [
  [0, 255, 0],
  [255, 0, 255],
  [0, 0, 255]
];

var files = [];
var fileIDs = [];
function createFileID(file){
    if(file.hash && file.hash.length>5) return file.hash
    else	return file.name + '.' + file.size;
}
function gotFile(file){
	return fileIDs.indexOf(createFileID(file)) > -1;
}
function addFile(file){
	var fileID = createFileID(file);
	files[fileID] = file;
	fileIDs.push(fileID);
}

export function show3DLocalizations(options, update_status_callback){
  // var fileid = createFileID({hash: options.file_hash, name: options.file_name, size: options.file_size})
  // if(fileIDs.indexOf(fileid)>=0){
  //   console.log('already added to the 3d view.')
  //   update_status_callback({rendering_status:"3D view rendered(loc.:"+options.filteredRows+", file:"+options.file_name+").", rendering_progress: 100, rendering: false})
  //   return false
  // }
  const bufferLength = (512 * 512); // defaulting to 2M
  const before = Date.now();
  const strideTitles = ["x", "y", "z"]
  const stridedArrayBuffers = [];
  const stridedFloat32Arrays = [];
  const float32Arrays = options.tableDict;
  const isFiltered = options.isFiltered;
  const numChunks = isFiltered?Math.ceil(options.filteredRows/bufferLength): Math.ceil(options.rows/bufferLength);
  for(var chunkIndex = 0; chunkIndex < numChunks; chunkIndex++){
      stridedArrayBuffers[chunkIndex] = new ArrayBuffer(bufferLength * 16); // 4x4 for four float32 values of four bytes for the values for the given stride indices
      stridedFloat32Arrays[chunkIndex]  = new Float32Array(stridedArrayBuffers[chunkIndex]);
  }
  const  normalization = {
        scale: Math.max(
            (options.max[strideTitles[0]]-options.min[strideTitles[0]]),
            (options.max[strideTitles[1]]-options.min[strideTitles[1]]),
            (options.max[strideTitles[2]]-options.min[strideTitles[2]])
        ),
        offsetX: (options.max[strideTitles[0]]-options.min[strideTitles[0]])/2,//options.avg[strideTitles[0]],
        offsetY: (options.max[strideTitles[1]]-options.min[strideTitles[1]])/2,//options.avg[strideTitles[1]],
        offsetZ: (options.max[strideTitles[2]]-options.min[strideTitles[2]])/2,//options.avg[strideTitles[2]],
        offsetT: 0,//options.avg[strideTitles[3]],
   }
   if(update_status_callback)
   update_status_callback({rendering: true, rendering_progress: 0, rendering_status: "normalize into strided array chunks"})

  let progress = -1;
  let filteredLine = 0;
  for (var line = 0; line < options.rows; line++) {
      var newProgress = Math.floor(100 * line / (options.rows+1));
      if(newProgress != progress){
          progress = newProgress;
          if(update_status_callback)
          update_status_callback({rendering_progress: progress})
      }
      if(isFiltered && !isFiltered[line]) continue
      var chunkIndex = Math.floor(filteredLine/bufferLength);
      var chunkLine = filteredLine - chunkIndex * bufferLength;
      var stridedFloat32Array = stridedFloat32Arrays[chunkIndex];

      stridedFloat32Array[chunkLine*4 + 0] = (float32Arrays[strideTitles[0]][line]-normalization.offsetX)/normalization.scale;
      stridedFloat32Array[chunkLine*4 + 1] = (float32Arrays[strideTitles[1]][line]-normalization.offsetY)/normalization.scale;
      stridedFloat32Array[chunkLine*4 + 2] = (float32Arrays[strideTitles[2]][line]-normalization.offsetZ)/normalization.scale;
      stridedFloat32Array[chunkLine*4 + 3] = 1;//(float32Arrays[strideTitles[3]][line]-normalization.offsetT)/normalization.scale;
      filteredLine += 1;
  }
  if(update_status_callback)
  update_status_callback({rendering_status:"normalize into strided array chunks [ms]: "+ (Date.now() - before)})
  const locations = {file_hash: options.file_hash, filteredRows:options.filteredRows, file_name: options.file_name, file_size: options.file_size, bufferLength: bufferLength, numChunks: numChunks, rows: options.rows, headers: options.headers, stridedArrayBuffers:stridedArrayBuffers}
  console.log( "normalize into strided array chunks [ms]: "+ (Date.now() - before), locations);
  render3DLocalizations(locations)
  update_status_callback({rendering_status:"3D view rendered(loc.:"+options.filteredRows+", file:"+options.file_name+").", rendering_progress: 100, rendering: false})
}

function render3DLocalizations(locations) {
  if (locations) {
    var file = {hash: locations.file_hash, name: locations.file_name, size: locations.file_size}
    var fileid = createFileID(file)
    var indx = fileIDs.indexOf(fileid)
    if(indx>=0){
      file = files[fileid]
    }
    locations.stridedFloat32Arrays = [];
    locations.textures = [];
    for (var chunk = 0; chunk < locations.numChunks; chunk++) {
      locations.stridedFloat32Arrays[chunk] = new Float32Array(locations.stridedArrayBuffers[chunk]);
      locations.textures[chunk] = createAndBindParticleTexture(locations.stridedFloat32Arrays[chunk], FBO_particles);
    }
    console.log(files)
    file.locations = locations;

    totalNumberOfChunks += locations.numChunks;

    if(indx>=0){
      onlocations();
    }
    else{
      addFile(file);
      onlocations();
      var colorIndex = fileIDs.length % colors.length;
      if(locations.numChunks > 0){
        var colorFolder = gui.addFolder(locations.file_name + ' (#' + locations.filteredRows +  ')');
        var N = fileIDs.indexOf(fileid);
        var activN = 'active ' + N;
        var colorN = 'color ' + N;
        var alphaN = 'alpha ' + N;
        scopeParams[activN] = true;
        scopeParams[colorN] = colors[colorIndex];
        scopeParams[alphaN] = 0.9;
        colorFolder.add(scopeParams, activN).onChange(setRerender);
        colorFolder.addColor(scopeParams, colorN).onChange(setRerender);
        colorFolder.add(scopeParams, alphaN, 0, 1).onChange(setRerender);
        colorFolder.open();
      }
      console.log(files, fileIDs);
      console.log("locations uploaded to WebGL textures:");
      console.log(locations);
    }

    chunksPerAnimationFrame = totalNumberOfChunks; // this will throttle down quickly enough
  } else {
    console.log("something went wrong");
  }
}

function fr() { // updates every second
  scopeParams.Fps = frame;
  gui.__controllers[0].updateDisplay();
  // document.getElementById("fps").textContent = isStill ? 0 : frame;
  // document.getElementById("ppf").textContent = isStill ? 0 : Math.floor(chunksPerAnimationFrame) + " x 256k";
  if(update_webgl_status_callback)
    update_webgl_status_callback({fps: isStill ? 0 : frame, ppf: isStill ? 0 : Math.floor(chunksPerAnimationFrame) + " x 256k"})
  frame = 0; // reset the frame counter
}

function mousewheel(event) {
  if(event.target != canvas) return;
  event.preventDefault();
  event.stopPropagation();

  var fovMAX = 130;
  var fovMIN = 1;

  camera.fov -= event.wheelDeltaY * 0.0033;
  camera.fov = Math.max(Math.min(camera.fov, fovMAX), fovMIN);
  camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, window.innerWidth / window.innerHeight, camera.near, camera.far);

  scopeParams.fov = camera.fov;
}
