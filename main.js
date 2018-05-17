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
		vCoord=vec3(-0.5*aPosition.x+0.5, -0.5*aPosition.y+0.5, aPosition.z);
		gl_Position=aPosition;
	}
`;

const waterFs=`
	uniform sampler2D uBackground;
	varying highp vec3 vCoord;
	void main(void){
		gl_FragColor=texture2D(uBackground, vec2(vCoord.x, -vCoord.y+1.0-vCoord.z))*0.5;
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
