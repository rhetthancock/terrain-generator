/*jslint browser: true */
/*global window */

var canvas;
var webgl;
var frames = 0;
var shaderProgram;
var shaderProgramData;
var terrain;

var buffers = {};

var mouseDown = false;
var mouseLastX;
var mouseLastY;
var mouseZoom = 1;

var xRotation = 0;
var yRotation = 50;
var zRotation = 0;

function addListeners() {
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("wheel", handleMouseWheel);
    canvas.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    
    var buttonGenerate = document.getElementById("generate");
    buttonGenerate.addEventListener("click", newTerrain);
    
    var buttonRandomize = document.getElementById("randomize");
    buttonRandomize.addEventListener("click", randomize);
}

function convertDegToRad(deg) {
    return (deg * Math.PI) / 180;
}

function draw() {
    var aspectRatio = canvas.width / canvas.height;
    var fov = 45;
    var modelViewMatrix = mat4.create();
    var normalViewMatrix = mat4.create();
    var projectionMatrix = mat4.create();
    var zFarthest = 100.0;
    var zNearest = 0.01;
    var scaleMatrix = mat4.create([
        mouseZoom, 0.0, 0.0, 0.0,
        0.0, mouseZoom, 0.0, 0.0,
        0.0, 0.0, mouseZoom, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
    
    var amplitude = parseFloat(document.getElementById("amplitude").value);
    var amplitudeMatrix = mat4.create([
        1.0, 0.0, 0.0, 0.0,
        0.0, amplitude, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
    var size = parseFloat(document.getElementById("size").value);
    var sizeMatrix = mat4.create([
        size, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, size, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
    
    var backgroundR = parseInt(document.getElementById("background-r").value) / 255;
    var backgroundG = parseInt(document.getElementById("background-g").value) / 255;
    var backgroundB = parseInt(document.getElementById("background-b").value) / 255;
    
    webgl.viewport(0, 0, canvas.width, canvas.height);
    webgl.clearColor(backgroundR, backgroundG, backgroundB, 1);
    webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
    webgl.useProgram(shaderProgram);
    webgl.enableVertexAttribArray(shaderProgramData.attribute.vertex);
    webgl.enableVertexAttribArray(shaderProgramData.attribute.normal);
    webgl.enableVertexAttribArray(shaderProgramData.attribute.color);
    
    mat4.perspective(fov, aspectRatio, zNearest, zFarthest, projectionMatrix);
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, [0.0, 0.0, -5.0]);
    mat4.identity(normalViewMatrix);
    
    mat4.rotate(modelViewMatrix, convertDegToRad(yRotation), [1, 0, 0]);
    mat4.rotate(modelViewMatrix, convertDegToRad(xRotation), [0, 1, 0]);
    mat4.rotate(modelViewMatrix, convertDegToRad(zRotation), [0, 0, 1]);
    mat4.rotate(normalViewMatrix, convertDegToRad(yRotation), [1, 0, 0]);
    mat4.rotate(normalViewMatrix, convertDegToRad(xRotation), [0, 1, 0]);
    mat4.rotate(normalViewMatrix, convertDegToRad(zRotation), [0, 0, 1]);
    
    mat4.multiply(modelViewMatrix, scaleMatrix);
    mat4.multiply(modelViewMatrix, amplitudeMatrix);
    mat4.multiply(modelViewMatrix, sizeMatrix);
    
    mat4.multiply(normalViewMatrix, mat4.inverse(amplitudeMatrix));
    mat4.multiply(normalViewMatrix, mat4.inverse(sizeMatrix));
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.vertex.points);
    webgl.vertexAttribPointer(
        shaderProgramData.attribute.vertex,
        buffers.vertex.size,    // size
        webgl.FLOAT,            // type
        false,                  // normalized
        0,                      // stride
        0                       // offset
    );
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.normal.points);
    webgl.vertexAttribPointer(
        shaderProgramData.attribute.normal,
        buffers.normal.size,    // size
        webgl.FLOAT,            // type
        false,                  // normalized
        0,                      // stride
        0                       // offset
    );
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.color.values);
    webgl.vertexAttribPointer(
        shaderProgramData.attribute.color,
        buffers.color.size,    // size
        webgl.FLOAT,            // type
        false,                  // normalized
        0,                      // stride
        0                       // offset
    );
    
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, buffers.index.points);
    
    webgl.uniformMatrix4fv(shaderProgramData.uniform.modelView, false, modelViewMatrix);
    webgl.uniformMatrix4fv(shaderProgramData.uniform.normalView, false, normalViewMatrix);
    webgl.uniformMatrix4fv(shaderProgramData.uniform.projection, false, projectionMatrix);
    
    var ambientR = parseInt(document.getElementById("ambient-r").value) / 255;
    var ambientG = parseInt(document.getElementById("ambient-g").value) / 255;
    var ambientB = parseInt(document.getElementById("ambient-b").value) / 255;
    webgl.uniform3fv(shaderProgramData.uniform.ambient, [ambientR, ambientG, ambientB]);
    
    var directionalR = parseInt(document.getElementById("directional-r").value) / 255;
    var directionalG = parseInt(document.getElementById("directional-g").value) / 255;
    var directionalB= parseInt(document.getElementById("directional-b").value) / 255;
    webgl.uniform3fv(shaderProgramData.uniform.directional, [directionalR, directionalG, directionalB]);
    
    var color1R = parseInt(document.getElementById("c1-r").value) / 255;
    var color1G = parseInt(document.getElementById("c1-g").value) / 255;
    var color1B = parseInt(document.getElementById("c1-b").value) / 255;
    webgl.uniform3fv(shaderProgramData.uniform.color1, [color1R, color1G, color1B]);
    
    var color2R = parseInt(document.getElementById("c2-r").value) / 255;
    var color2G = parseInt(document.getElementById("c2-g").value) / 255;
    var color2B = parseInt(document.getElementById("c2-b").value) / 255;
    webgl.uniform3fv(shaderProgramData.uniform.color2, [color2R, color2G, color2B]);
    
    webgl.drawElements(webgl.TRIANGLES, buffers.index.length, webgl.UNSIGNED_SHORT, 0);
    
    document.getElementById("frames").innerHTML = "f:" + frames++;
    window.requestAnimationFrame(draw);
}

function handleMouseDown(event) {
    mouseDown = true;
    mouseLastX = event.clientX;
    mouseLastY = event.clientY;
}

function handleMouseMove(event) {
    if(mouseDown) {
        xRotation += (event.clientX - mouseLastX) / 4;
        yRotation += (event.clientY - mouseLastY) / 4;
        mouseLastX = event.clientX;
        mouseLastY = event.clientY;
    }
}

function handleMouseUp() {
    mouseDown = false;
}

function handleMouseWheel(event) {
    mouseZoom += (event.deltaY / 500);
    if(mouseZoom < 0.1) {
        mouseZoom = 0.1;
    }
    else if(mouseZoom >= 5) {
        mouseZoom = 5;
    }
    document.getElementById("zoom").innerHTML = "z:" + Math.round(mouseZoom * 100) / 100;
}

function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initBufferColor() {
    buffers.color = {};
    buffers.color.values = webgl.createBuffer();
    buffers.color.size = 1;
    buffers.color.length = terrain.colors.map.length;
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.color.values);
    webgl.bufferData(
        webgl.ARRAY_BUFFER,
        new Float32Array(terrain.colors.map),
        webgl.STATIC_DRAW
    );
}

function initBufferIndex() {
    buffers.index = {};
    buffers.index.points = webgl.createBuffer();
    buffers.index.size = 3;
    buffers.index.length = terrain.faces.length;
    
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, buffers.index.points);
    webgl.bufferData(
        webgl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(terrain.faces),
        webgl.STATIC_DRAW
    );
}

function initBufferNormal() {
    buffers.normal = {};
    buffers.normal.points = webgl.createBuffer();
    buffers.normal.size = 3;
    buffers.normal.length = terrain.normals.length / buffers.normal.size;
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.normal.points);
    webgl.bufferData(
        webgl.ARRAY_BUFFER,
        new Float32Array(terrain.normals),
        webgl.STATIC_DRAW
    );
}

function initBufferVertex() {
    buffers.vertex = {};
    buffers.vertex.points = webgl.createBuffer();
    buffers.vertex.size = 3;
    buffers.vertex.length = terrain.vertices.length / buffers.vertex.size;
    
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.vertex.points);
    webgl.bufferData(
        webgl.ARRAY_BUFFER,
        new Float32Array(terrain.vertices),
        webgl.STATIC_DRAW
    );
}

function initShaders() {
    var fragmentShader = loadShader("shader-fragment");
    var vertexShader = loadShader("shader-vertex");
    shaderProgram = webgl.createProgram();
    webgl.attachShader(shaderProgram, vertexShader);
    webgl.attachShader(shaderProgram, fragmentShader);
    webgl.linkProgram(shaderProgram);
    if(webgl.getProgramParameter(shaderProgram, webgl.LINK_STATUS)) {
        shaderProgramData = {
            attribute: {
                vertex: webgl.getAttribLocation(shaderProgram, "aVertex"),
                normal: webgl.getAttribLocation(shaderProgram, "aNormal"),
                color: webgl.getAttribLocation(shaderProgram, "aColorWeight")
            },
            uniform: {
                ambient: webgl.getUniformLocation(shaderProgram, "uAmbient"),
                directional: webgl.getUniformLocation(shaderProgram, "uDirectional"),
                projection: webgl.getUniformLocation(shaderProgram, "uProjection"),
                modelView: webgl.getUniformLocation(shaderProgram, "uModelView"),
                normalView: webgl.getUniformLocation(shaderProgram, "uNormalView"),
                color1: webgl.getUniformLocation(shaderProgram, "uColor1"),
                color2: webgl.getUniformLocation(shaderProgram, "uColor2")
            }
        };
    }
    else {
        console.error("Unable to initialize shader program:");
        console.log(webgl.getProgramInfoLog(shaderProgram));
        webgl.deleteProgram(shaderProgram);
    }
}

function loadShader(id) {
    var script = document.getElementById(id);
    var shader;
    if(script.type == "x-shader/x-fragment") {
        shader = webgl.createShader(webgl.FRAGMENT_SHADER);
    }
    else if(script.type == "x-shader/x-vertex") {
        shader = webgl.createShader(webgl.VERTEX_SHADER);
    }
    webgl.shaderSource(shader, script.text);
    webgl.compileShader(shader);
    if(webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        return shader;
    }
    else {
        console.error(webgl.getShaderInfoLog(shader));
    }
}

function main() {
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    webgl = canvas.getContext("webgl");
    terrain = new Terrain(7, 2.0, 2.0);
    console.log(terrain);
    
    if(webgl == null) {
        alert("Unable to initialize WebGL!");
    }
    else {
        addListeners();
        initShaders();
        initBufferVertex();
        initBufferNormal();
        initBufferIndex();
        initBufferColor();
        webgl.enable(webgl.DEPTH_TEST);
        draw();
    }
}

function newTerrain() {
    var detail = parseInt(document.getElementById("detail").value);
    var smoothness = parseFloat(document.getElementById("smoothness").value);
    var blending = parseFloat(document.getElementById("blending").value);
    terrain = new Terrain(detail, smoothness, blending);
    initBufferVertex();
    initBufferNormal();
    initBufferIndex();
    initBufferColor();
    console.log(terrain);
}

function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomize() {
    document.getElementById("smoothness").value = (Math.round(Math.random() * 20) / 10) + 1.5; // 1.5 - 3.5
    document.getElementById("blending").value = (Math.round(Math.random() * 90) / 10) + 1.0; // 1.0 - 10.0
    document.getElementById("amplitude").value = (Math.round(Math.random() * 25) / 10) + 1.0; // 1.0 - 3.5
    document.getElementById("ambient-r").value = randomInt(0, 150);
    document.getElementById("ambient-g").value = randomInt(0, 150);
    document.getElementById("ambient-b").value = randomInt(0, 150);
    document.getElementById("directional-r").value = randomInt(0, 255);
    document.getElementById("directional-g").value = randomInt(0, 255);
    document.getElementById("directional-b").value = randomInt(0, 255);
    document.getElementById("c1-r").value = randomInt(5, 75);
    document.getElementById("c1-g").value = randomInt(5, 75);
    document.getElementById("c1-b").value = randomInt(5, 75);
    document.getElementById("c2-r").value = randomInt(155, 255);
    document.getElementById("c2-g").value = randomInt(155, 255);
    document.getElementById("c2-b").value = randomInt(155, 255);
    newTerrain();
}

window.addEventListener("load", main);