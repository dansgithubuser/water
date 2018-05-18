window.onload=main;

var gl;
var backgroundDrawer;

function render(timeMs){
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	backgroundDrawer.draw(gl.TRIANGLE_STRIP);
	waterDrawer.draw(gl.TRIANGLE_STRIP);
	requestAnimationFrame(render);
}

const backgroundVs=`
	attribute vec4 aPosition;
	varying highp vec2 vCoord;
	void main(void){
		vCoord=(-aPosition.xy+1.0)/2.0;
		gl_Position=aPosition;
	}
`;

const backgroundFs=`
	uniform sampler2D uBackground;
	varying highp vec2 vCoord;
	void main(void){
		gl_FragColor=texture2D(uBackground, vCoord);
	}
`;

const waterVs=`
	attribute vec4 aPosition;
	varying highp vec3 vCoord;
	void main(void){
		vCoord=aPosition.xyz;
		gl_Position=aPosition;
	}
`;

const waterFs=`
	uniform sampler2D uBackground;
	varying highp vec3 vCoord;

	highp float hash(vec2 p){
		return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453123);
	}

	highp float noise(vec2 p){
		highp vec2 i=floor(p);
		highp vec2 f=fract(p);
		highp vec2 u=f*f*(3.0-2.0*f);
		return mix(
			mix(hash(i+vec2(0.0, 0.0)), hash(i+vec2(1.0, 0.0)), u.x),
			mix(hash(i+vec2(0.0, 1.0)), hash(i+vec2(1.0, 1.0)), u.x),
			u.y
		);
	}

	void main(void){
		highp vec2 v=vec2(vCoord.x/8.0, vCoord.y)/(vCoord.y-vCoord.z);
		gl_FragColor=vec4(noise(v*40.0), 0.0, 0.0, 1.0);
	}
`;

function main(){
	const canvas=document.getElementById('canvas');
	gl=canvas.getContext('webgl');
	if(!gl){
		alert('unable to initialize WebGL');
		return;
	}
	backgroundDrawer=new Drawer(gl,
		backgroundVs, backgroundFs,
		{
			attributes: {aPosition: 'vec4'},
			texture: {name: 'uBackground', url: 'background.png'},
		},
	);
	backgroundDrawer.setAttributes({
		aPosition: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	});
	waterDrawer=new Drawer(gl,
		waterVs, waterFs,
		{
			attributes: {aPosition: 'vec4'},
			texture: {name: 'uBackground', url: 'background.png'},
		},
	);
	waterDrawer.setAttributes({
		aPosition: [[-1, -1, 0.1], [1, -1, 0.1], [-1, 0.1, 0.1], [1, 0.1, 0.1]],
	});
	requestAnimationFrame(render);
}
