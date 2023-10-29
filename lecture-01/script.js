import { WebGLUtility, ShaderProgram } from "../lib/webgl.min.js";
import { Pane } from "../lib/tweakpane-4.0.0.min.js";

window.addEventListener(
	"DOMContentLoaded",
	async () => {
		const app = new WebGLApp();
		window.addEventListener("resize", app.resize, false);
		app.init("webgl-canvas");
		await app.load();

		let timeCounter = 0;

		const interval = () => {
			app.setup(timeCounter);
			app.render();
			timeCounter++;
		};
		setInterval(interval, 1000);
		// setInterval(interval, 1000 /30);
	},
	false
);

class WebGLApp {
	constructor() {
		this.canvas = null;
		this.gl = null;
		this.running = false;

		this.resize = this.resize.bind(this);
		this.render = this.render.bind(this);
	}
	async load() {
		const vs = await WebGLUtility.loadFile("./main.vert");
		const fs = await WebGLUtility.loadFile("./main.frag");
		this.shaderProgram = new ShaderProgram(this.gl, {
			vertexShaderSource: vs,
			fragmentShaderSource: fs,
			attribute: ["position", "color"],
			stride: [3, 4],
		});
	}
	setup(timeCounter) {
		this.setupGeometry(timeCounter);
		this.resize();
		this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
		this.running = true;
	}
	setupGeometry(timeCounter) {
		console.log(timeCounter);
		this.position = [];
		this.color = [];

		const matrixColor = [0.1569, 0.6627, 0.0039, 1.0];
		const COUNT = 72;
		let opacity = 1.0;

		for (let i = 0; i < COUNT; ++i) {
			const x = i / (COUNT - 1);
			const signedX = x * 2.0 - 1.0;
			for (let j = 0; j < COUNT; ++j) {
				const y = j / (COUNT - 1);
				const signedY = y * 2.0 - 1.0;
				this.position.push(signedX, signedY, 0.0);

				const startIndex = timeCounter % COUNT;
				let opacity = 1.0;
				if ((timeCounter + 1) / 10 <= 1) {
					opacity = (j % 72.0) * (1.0 / 72.0);
					opacity = opacity - (((timeCounter % (10 + 1))) * 0.1);
				} else {
					opacity = 0.0;
				}

				this.color.push(matrixColor[0], matrixColor[1], matrixColor[2], opacity);
			}
		}

		this.vbo = [
			WebGLUtility.createVbo(this.gl, this.position),
			WebGLUtility.createVbo(this.gl, this.color),
		];
	}

	render() {
		const gl = this.gl;

		if (this.running === true) {
			requestAnimationFrame(this.render);
		}

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.shaderProgram.use();
		this.shaderProgram.setAttribute(this.vbo);

		gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
	}
	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}
	init(canvas, option = {}) {
		if (canvas instanceof HTMLCanvasElement === true) {
			this.canvas = canvas;
		} else if (Object.prototype.toString.call(canvas) === "[object String]") {
			const c = document.querySelector(`#${canvas}`);
			if (c instanceof HTMLCanvasElement === true) {
				this.canvas = c;
			}
		}
		if (this.canvas == null) {
			throw new Error("invalid argument");
		}
		this.gl = this.canvas.getContext("webgl", option);
		if (this.gl == null) {
			throw new Error("webgl not supported");
		}
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	}
}
