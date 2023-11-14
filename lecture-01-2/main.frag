precision mediump float;

varying vec4 vColor;
varying float vTime;

void main() {
  gl_FragColor = vColor * (sin(vTime) * 0.5 + 0.5);
}

