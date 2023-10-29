attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

void main() {
  vColor = color;
  gl_Position = vec4(position, 1.0);
  gl_PointSize = 10.0;
}