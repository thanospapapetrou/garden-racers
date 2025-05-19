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

uniform Light light;
uniform sampler2D terrain;

in vec3 vertexNormal;
in vec3[DIRECTIONS] vertexTextureCoordinates;
in float test;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    float p = 0.0;
    for (int i = 0; i < DIRECTIONS; i++) {
        fragmentColor.rgb += texture(terrain, vertexTextureCoordinates[i].st).rgb * vertexTextureCoordinates[i].p;
        p += vertexTextureCoordinates[i].p;
    }
    fragmentColor.rgb /= p;
    //fragmentColor.rgb = vec3(p > 0.0, 1.0, 0.0);// TODO
    fragmentColor.rgb *= light.ambient + light.directional.color * max(dot(normalize(vertexNormal),
            normalize(-light.directional.direction)), 0.0);
}
