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

		uniform mat4 uNormalMatrix;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		uniform float uTime;
		uniform float uWaves[6*8];

		varying highp vec3 vNormal;
		varying highp vec4 vPosition;

		void main(void){
			vNormal=vec3(0.0, 0.0, 0.0);
			vec3 offset=vec3(0.0, 0.0, 0.0);
			for(int i=0; i<8; ++i){
				float qh=uWaves[6*i+0];
				float a=uWaves[6*i+1];
				float w=uWaves[6*i+2];
				vec2 d=vec2(uWaves[6*i+3], uWaves[6*i+4]);
				float phi=uWaves[6*i+5];
				float q=qh/(w*a)/8.0;
				float angle=dot(w*d, aVertexPosition.xz)+phi*uTime;
				float c=cos(angle);
				float s=sin(angle);
				vNormal+=vec3(
					-d.x*w*a*c,
					-q*w*a*s,
					-d.y*w*a*c
				);
				offset+=vec3(
					q*a*d.x*c,
					-a*s,
					q*a*d.y*c
				);
			}
			vNormal=vec3(
				vNormal.x,
				1.0-vNormal.y,
				vNormal.z
			);
			vNormal=(uNormalMatrix*vec4(vNormal, 1.0)).xyz;
			vPosition=uModelViewMatrix*(aVertexPosition+vec4(offset, 0.0));
			gl_Position=uProjectionMatrix*vPosition;
		}`;

	const fsSource=`
		varying highp vec3 vNormal;
		varying highp vec4 vPosition;

		uniform sampler2D uSampler;

		void main(void){
			//reflect eye-to-fragment by normal
			highp vec3 reflected=reflect(vPosition.xyz, vNormal);
			//background is plane that contains point (0, 0, -100) and has normal (0, 0, 1)
			const highp vec3 p0=vec3(0.0, 0.0, -100.0);
			const highp vec3 n=vec3(0.0, 0.0, 1.0);
			//intersect this plane with line that starts at vPosition and travels in reflected direction
			highp float d=dot((p0-vPosition.xyz), n)/dot(reflected, n);
			gl_FragColor=vec4(0.0, 0.0, 0.0, 1.0);
			if(d>0.0) gl_FragColor=texture2D(uSampler, vec2(
				 (vPosition.x+d*reflected.x)/120.0+0.5,
				-(vPosition.y+d*reflected.y)/ 60.0+0.5+0.1
			));
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
			normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
			time: gl.getUniformLocation(shaderProgram, 'uTime'),
			sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
			waves: gl.getUniformLocation(shaderProgram, 'uWaves'),
		},
	};
	const buffers=initBuffers(gl);
	const texture=loadTexture(gl, 'background.png');

	gl.useProgram(programInfo.program);
	var waves=[]
	for(var i=0; i<8; ++i){
		var qh=0.2;
		var r=0.5+1.5*Math.random();
		var a=0.5*r;
		var w=0.5*r;
		var theta=Math.random()*Math.PI*2/8;
		var dx=Math.cos(theta);
		var dy=Math.sin(theta);
		var phi=Math.sqrt(9.8*w);
		waves=waves.concat([qh, a, w, dx, dy, phi])
	}
	gl.uniform1fv(programInfo.uniformLocations.waves, new Float32Array(waves), 6*8);

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
	for(var z=-100; z<=100; z+=5){
		var firstCol=true;
		for(var x=-100; x<=100; x+=5){
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
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	const fieldOfView=Math.PI/4;
	const aspect=gl.canvas.clientWidth/gl.canvas.clientHeight;
	const zNear=0.1;
	const zFar=100.0;
	const projectionMatrix=mat4.create();

	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	const modelViewMatrix=mat4.create();
	mat4.rotate(modelViewMatrix, modelViewMatrix, time/10, [0, 1, 0]);

	const normalMatrix=mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

	gl.uniform1f(programInfo.uniformLocations.time, time);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(programInfo.uniformLocations.sampler, 0);

	gl.drawElements(gl.TRIANGLES, buffers.indicesSize, gl.UNSIGNED_SHORT, 0);
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
