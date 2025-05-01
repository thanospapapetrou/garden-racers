#version 300 es

precision lowp float;

struct Directional {
    vec3 color;
    vec3 direction;
};

struct Light {
    vec3 ambient;
    Directional directional;
};

uniform Light light;

in vec3 vertexNormal;
in vec4 vertexColor;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vertexColor;
    fragmentColor.rgb *= light.ambient + light.directional.color * max(dot(normalize(vertexNormal),
            normalize(-light.directional.direction)), 0.0);
}
