window.onload=main;

var gl;
var backgroundDrawer;

function render(timeMs){
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	backgroundDrawer.draw(gl.TRIANGLE_STRIP);
	waterDrawer.setUniform('uTime', timeMs/1000);
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
	uniform highp float uTime;
	varying highp vec3 vCoord;

	highp float hash(highp vec2 p){
		return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453123);
	}

	highp float noise(highp vec2 p){
		highp vec2 i=floor(p);
		highp vec2 f=fract(p);
		highp vec2 u=f*f*(3.0-2.0*f);
		return mix(
			mix(hash(i+vec2(0.0, 0.0)), hash(i+vec2(1.0, 0.0)), u.x),
			mix(hash(i+vec2(0.0, 1.0)), hash(i+vec2(1.0, 1.0)), u.x),
			u.y
		);
	}

	highp float water(highp vec2 p){
		highp float h=0.0;
		highp float amplitude=0.01;
		highp float f=1.0;
		const highp mat2 m=mat2(1.6, 1.2, -1.2, 1.6);
		for(int i=0; i<4; ++i){
			h+=amplitude*noise(p+uTime*f);
			amplitude*=0.5;
			p*=m;
			f*=2.0;
		}
		return h;
	}

	highp vec3 normal(highp vec2 p){
		const highp float e=0.001;
		highp vec3 n;
		n.y=water(p);
		n.x=water(p+vec2(  e, 0.0))-n.y;
		n.z=water(p+vec2(0.0,   e))-n.y;
		n.y=e;
		return normalize(n);
	}

	void main(void){
		highp vec2 p=vec2(vCoord.x/8.0, vCoord.y)/(vCoord.y-vCoord.z);
		highp vec3 n=normal(p*40.0);
		highp vec3 r=vec3(vCoord.x, vCoord.y-2.0*vCoord.z, 1.0);
		r=reflect(r, n);
		highp vec4 color=texture2D(uBackground, vec2(-0.5*r.x+0.5, -0.5*r.y+0.5));
		color=mix(color, vec4(0.01, 0.05, 0.2, 1.0), dot(r, n));
		gl_FragColor=color;
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
			uniforms: {'uTime': 0},
		},
	);
	waterDrawer.setAttributes({
		aPosition: [[-1, -1, 0.1], [1, -1, 0.1], [-1, 0.1, 0.1], [1, 0.1, 0.1]],
	});
	requestAnimationFrame(render);
}
