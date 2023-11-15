attribute vec3 planePosition;
attribute vec3 spherePosition;
attribute vec4 color;

uniform float time;
uniform float ratio;
uniform mat4 mvpMatrix;

varying vec4 vColor;
varying float vTime;

void main() {
	vec3 p = mix(planePosition, spherePosition, ratio);

  vColor = color;
  vTime = time;

  float s = sin(p.y + time);
  p += vec3(0.0,1.0,s);
  gl_Position = mvpMatrix * vec4(p, 1.0);

  gl_PointSize = 5.0;
}