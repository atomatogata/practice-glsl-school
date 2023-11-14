attribute vec3 position;
attribute vec4 color;

uniform float time;
uniform mat4 mvpMatrix;

varying vec4 vColor;
varying float vTime;

void main() {
  vColor = color;
  vTime = time;
  gl_PointSize = 5.0;

  float s = sin(position.x + time);
  vec3 p = position + vec3(0.0,0.0,s);
  
  gl_Position = mvpMatrix * vec4(p, 1.0);
}