import { WebGLUtility, ShaderProgram } from "../lib/webgl.min.js";
import { WebGLMath } from "../lib/math.js"; // 算術用クラスを追加 @@@
import { Pane } from "../lib/tweakpane-4.0.0.min.js";

window.addEventListener(
	"DOMContentLoaded",
	async () => {
		const app = new WebGLApp();
		window.addEventListener("resize", app.resize, false);
		app.init("webgl-canvas");
		await app.load();
		app.setup(app.timeCount);
		app.render();
	},
	false
);
class WebGLApp {
	constructor() {
		this.canvas = null;
		this.gl = null;
		this.running = false;
		this.timeCount = 0;

		this.resize = this.resize.bind(this);
		this.render = this.render.bind(this);

		this.previousTime = 0;
		this.timeScale = 1.0;
		this.uTime = 0.0;

		// tweakpaneの初期化
		const pane = new Pane();
		pane
			.addBlade({
				view: "slider",
				label: "time-scale",
				min: 0.0,
				max: 2.0,
				value: this.timeScale,
			})
			.on("change", (v) => {
				this.timeScale = v.value;
			});
	}

	async load() {
		const vs = await WebGLUtility.loadFile("./main.vert");
		const fs = await WebGLUtility.loadFile("./main.frag");
		this.shaderProgram = new ShaderProgram(this.gl, {
			vertexShaderSource: vs,
			fragmentShaderSource: fs,
			attribute: ["position", "color"],
			stride: [3, 4],
			uniform: ["time", "mvpMatrix"],
			type: ["uniform1f", "uniformMatrix4fv"],
		});
	}
	setup(timeCount) {
		timeCount++;
		console.log(timeCount);
		this.setupGeometry(timeCount);
		this.resize();
		this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
		this.running = true;
		this.previousTime = Date.now();
	}
	setupGeometry(timeCount) {
		// console.log(timeCount);
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

				const sortJ = Math.abs(COUNT - 1 - j);

				const fadeRange = 36;
				const currentFadeStart = timeCount % COUNT;
				const currentFadeEnd = (currentFadeStart + fadeRange) % COUNT;

				if (currentFadeEnd > currentFadeStart) {
					if (sortJ >= currentFadeStart && sortJ < currentFadeEnd) {
						opacity = (sortJ - currentFadeStart) / fadeRange;
					} else {
						opacity = 0.0;
					}
				} else {
					if (sortJ < currentFadeEnd) {
						opacity = sortJ / fadeRange;
					} else if (sortJ >= currentFadeStart) {
						opacity = (sortJ - currentFadeStart) / fadeRange;
					} else {
						opacity = 0.0;
					}
				}

				this.position.push(signedX, signedY, 0.0);
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
		const m4 = WebGLMath.Mat4;
		const v3 = WebGLMath.Vec3;

		if (this.running === true) {
			requestAnimationFrame(this.render);
		}

		// now
		const now = Date.now();
		// this.previousTime => setup()時のタイムスタンプ
		const time = (now - this.previousTime) / 1000;

		// 時間のスケールを考慮して、経過時間を加算 @@@
		this.uTime += time * this.timeScale;
		// 次のフレームで使えるように現在のタイムスタンプを保持しておく @@@
		this.previousTime = now;

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// model
		const rotateAxis = v3.create(1.0, 0.0, 0.0); // X 軸回転を掛ける
		// angle
		const rotateAngle = this.uTime * 0.1;
		const m = m4.rotate(m4.identity(), rotateAngle, rotateAxis);

		// ビュー座標変換行列（ここではカメラは固定）
		const eye = v3.create(0.0, 0.0, 3.0); // カメラの位置
		const center = v3.create(0.0, 0.0, 0.0); // カメラの注視点
		const upDirection = v3.create(0.0, 1.0, 0.0); // カメラの天面の向き
		const v = m4.lookAt(eye, center, upDirection);

		// プロジェクション座標変換行列
		const fovy = 60; // 視野角（度数）
		const aspect = this.canvas.width / this.canvas.height; // アスペクト比
		const near = 0.1; // ニア・クリップ面までの距離
		const far = 10.0; // ファー・クリップ面までの距離
		const p = m4.perspective(fovy, aspect, near, far);

		// 行列を乗算して MVP 行列を生成する（行列を掛ける順序に注意）
		const vp = m4.multiply(p, v);
		const mvp = m4.multiply(vp, m);

		this.shaderProgram.use();
		this.shaderProgram.setAttribute(this.vbo);
		this.shaderProgram.setUniform([this.uTime, mvp]);

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
