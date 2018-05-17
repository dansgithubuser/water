window.onload=main;

var gl;
var backgroundDrawer;

function render(timeMs){
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	backgroundDrawer.draw(gl.TRIANGLE_STRIP);
	requestAnimationFrame(render);
}

const backgroundVs=`
	attribute vec4 aPosition;
	varying highp vec2 vCoord;
	void main(void){
		vCoord=(aPosition.xy+1.0)/2.0;
		gl_Position=aPosition;
	}
`;

const backgroundFs=`
	varying highp vec2 vCoord;
	void main(void){
		gl_FragColor=vec4(vCoord.x, vCoord.y, 0.0, 1.0);
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
		},
	);
	backgroundDrawer.setAttributes({
		aPosition: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	});
	requestAnimationFrame(render);
}
