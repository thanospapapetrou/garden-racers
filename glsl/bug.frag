#version 300 es

precision lowp float;

struct Directional {
    vec3 color;
    vec3 direction;
};

uniform light {
    vec3 ambient;
    Directional directional;
};

in vec3 vertexNormal;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
    fragmentColor.rgb *= ambient + directional.color * max(dot(normalize(vertexNormal),
            normalize(-directional.direction)), 0.0);
}
