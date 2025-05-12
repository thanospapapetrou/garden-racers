#version 300 es

precision lowp float;

#define DIRECTIONS 9

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
in vec3[DIRECTIONS] vertexTextureCoordinates;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    float weight = 0.0f;
    for (int i = 0; i < DIRECTIONS; i++) {
        fragmentColor.rgb += texture(terrain, vertexTextureCoordinates[i].st).rgb * vertexTextureCoordinates[i].p;
        weight += vertexTextureCoordinates[i].p;
    }
    if (weight > 0.0) {
        fragmentColor.rgb /= weight;
    }
    fragmentColor.rgb *= light.ambient + light.directional.color * max(dot(normalize(vertexNormal),
            normalize(-light.directional.direction)), 0.0);
}
