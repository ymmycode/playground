uniform float uTime;
uniform float transition2Value;

in vec2 vUv;

const float PI = 3.14159265358979323846;

void main()
{
    vec2 newUV = vec2(
        vUv.x + sin(vUv.y * 30.0 + uTime * 2.0) * 0.01,
        vUv.y + sin(vUv.x * 50.0 + uTime * 2.0) * 0.01
    );
    float alpha = step(0.0, distance(newUV, vec2(0.5)) - transition2Value);
    gl_FragColor = vec4(0.82, 0.75, 0.23, alpha);
    // gl_FragColor = vec4(vec3(alpha), 1.0);
}