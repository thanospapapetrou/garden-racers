#version 300 es

precision lowp float;

uniform light {
    vec3 ambient;
    vec3 color;
    vec3 direction;
};

in vec3 vertexNormal;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
    fragmentColor.rgb *= ambient + color * max(dot(normalize(vertexNormal),
            normalize(-direction)), 0.0);
}
