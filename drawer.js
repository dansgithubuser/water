class Drawer{
	constructor(gl, vertexShaderSource, fragmentShaderSource, options){
		this.gl=gl;
		const vertexShader=this._createShader(gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader=this._createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
		this.program=gl.createProgram();
		gl.attachShader(this.program, vertexShader);
		gl.attachShader(this.program, fragmentShader);
		gl.linkProgram(this.program);
		if(!gl.getProgramParameter(this.program, gl.LINK_STATUS))
			alert('unable to initialize shader program: '+gl.getProgramInfoLog(this.program));
		this.attributes={};
		if('attributes' in options) for(var attribute in options.attributes){
			this.attributes[attribute]={buffer: gl.createBuffer()};
			var loc=gl.getAttribLocation(this.program, attribute);
			gl.enableVertexAttribArray(loc);
		}
		this.texture=null;
		if('texture' in options){
			this.texture=this._createTexture(options.texture.url);
		}
		this.uniforms={};
		if('uniforms' in options) for(var uniform in options.uniforms){
			this.uniforms[uniform]=gl.getUniformLocation(this.program, uniform);
			this.setUniform(uniform, options.uniforms[uniform]);
		}
	}

	setAttributes(attributes){
		const gl=this.gl;
		for(var attribute in attributes){
			this.attributes[attribute].values=attributes[attribute];
			gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes[attribute].buffer);
			var flattened=[].concat(...attributes[attribute]);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattened), gl.STATIC_DRAW);
		}
	}

	setUniform(name, value){
		const gl=this.gl;
		gl.useProgram(this.program);
		gl.uniform1f(this.uniforms[name], value);
	}

	draw(primitive){
		const gl=this.gl;
		gl.useProgram(this.program);
		var vertices=0;
		for(var attribute in this.attributes){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes[attribute].buffer);
			var loc=gl.getAttribLocation(this.program, attribute);
			gl.vertexAttribPointer(loc, this.attributes[attribute].values[0].length, gl.FLOAT, false, 0, 0);
			vertices=this.attributes[attribute].values.length;
		}
		gl.drawArrays(primitive, 0, vertices);
	}

	_createShader(type, source){
		const gl=this.gl;
		const shader=gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			alert('error compiling shader: '+gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	_createTexture(url){
		const gl=this.gl;
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
}
