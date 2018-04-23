//https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample7/webgl-demo.js
window.onload=main;

function main(){
	const canvas=document.getElementById('canvas');
	const gl=canvas.getContext('webgl');
	if(!gl){
		alert('unable to initialize WebGL');
		return;
	}

	const vsSource=`
		attribute vec4 aVertexPosition;

		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		uniform float uTime;

		void main(void){
			const float qh=0.5;
			const float a=1.0;
			const float w=1.0;
			const vec2 d=vec2(1.0, 0.0);
			const float phi=1.0;
			const float q=qh/(w*a);
			float angle=dot(w*d, aVertexPosition.xz)+phi*uTime;
			gl_Position=uProjectionMatrix*uModelViewMatrix*(aVertexPosition+vec4(
				q*a*d.x*cos(angle),
				a*sin(angle),
				q*a*d.y*cos(angle),
				0.0
			));
		}`;

	const fsSource=`
		uniform sampler2D uSampler;

		void main(void){
			gl_FragColor=vec4(0.0, 1.0, 0.0, 1.0);
		}`;

	const shaderProgram=initShaderProgram(gl, vsSource, fsSource);
	const programInfo={
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
			time: gl.getUniformLocation(shaderProgram, 'uTime'),
			sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
		},
	};
	const buffers=initBuffers(gl);
	const texture=loadTexture(gl, 'background.png');
	function render(timeMs){
		drawScene(gl, programInfo, buffers, texture, timeMs/1000);
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

function initBuffers(gl){
	var positions=[];
	var indices=[];
	var firstRow=true;
	var verticesPerRow=null;
	for(var z=-100; z<=100; z+=10){
		var firstCol=true;
		for(var x=-100; x<=100; x+=10){
			positions=positions.concat([x, -5, z]);
			if(!firstRow&&!firstCol){
				const k=positions.length/3-1;
				const r=verticesPerRow;
				indices=indices.concat([
					k-r-1, k-r, k,
					k-r-1, k  , k-1
				]);
			}
			firstCol=false;
		}
		if(firstRow){
			verticesPerRow=positions.length/3;
			firstRow=false;
		}
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const indexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		indices: indexBuffer,
		indicesSize: indices.length,
	};
}

function loadTexture(gl, url){
	const texture=gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//create a simple local texture
	const level=0;
	const internalFormat=gl.RGBA;
	const width=1;
	const height=1;
	const border=0;
	const srcFormat=gl.RGBA;
	const srcType=gl.UNSIGNED_BYTE;
	const pixel=new Uint8Array([0, 0, 255, 255]);
	gl.texImage2D(
		gl.TEXTURE_2D, level, internalFormat, width, height, border,
		srcFormat, srcType, pixel
	);
	//update texture when image loads
	const image=new Image();
	image.onload=function(){
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D, level, internalFormat,
			srcFormat, srcType, image
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	};
	image.src=url;
	return texture;
}

function drawScene(gl, programInfo, buffers, texture, time){
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const fieldOfView=Math.PI/4;
	const aspect=gl.canvas.clientWidth/gl.canvas.clientHeight;
	const zNear=0.1;
	const zFar=100.0;
	const projectionMatrix=mat4.create();

	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	const modelViewMatrix=mat4.create();

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

	gl.uniform1f(programInfo.uniformLocations.time, time);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(programInfo.uniformLocations.sampler, 0);

	gl.drawElements(gl.LINE_STRIP, buffers.indicesSize, gl.UNSIGNED_SHORT, 0);
}

function initShaderProgram(gl, vsSource, fsSource){
	const vertexShader=loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader=loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram=gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		alert('unable to initialize shader program: '+gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	return shaderProgram;
}

function loadShader(gl, type, source){
	const shader=gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		var typeS=null;
		if(type==gl.VERTEX_SHADER) typeS='vertex';
		if(type==gl.FRAGMENT_SHADER) typeS='fragment';
		alert('error compiling '+typeS+' shader: '+gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}
