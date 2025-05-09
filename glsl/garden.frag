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

uniform sampler2D terrain;
uniform Light light;

in vec3 vertexNormal;
in vec3 vertexTextureCoordinates;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = texture(terrain, vertexTextureCoordinates.st);
    fragmentColor.rgb *= light.ambient + light.directional.color * max(dot(normalize(vertexNormal),
            normalize(-light.directional.direction)), 0.0);
}
