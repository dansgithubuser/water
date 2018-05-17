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
			this.attributes[attribute]=gl.createBuffer();
		}
		this.textures={};
		if('textures' in options) for(var texture in options.textures){
			this.textures[texture]=this._createTexture(options.textures[texture]);
		}
	}

	setAttributes(attributes){
		const gl=this.gl;
		for(var attribute in attributes){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes[attribute]);
			var flattened=[].concat(...attributes[attribute]);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattened), gl.STATIC_DRAW);
			var loc=gl.getAttribLocation(this.program, attribute);
			gl.vertexAttribPointer(loc, attributes[attribute][0].length, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(loc);
			this.vertices=attributes[attribute].length;
		}
	}

	draw(primitive){
		const gl=this.gl;
		gl.useProgram(this.program);
		gl.drawArrays(primitive, 0, this.vertices);
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
}
