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
uniform sampler2D terrain;

in vec3 vertexNormal;
in vec3[9] vertexTextureCoordinates;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    float p = 0.0;
    for (int i = 0; i < vertexTextureCoordinates.length(); i++) {
        fragmentColor.rgb += texture(terrain, vertexTextureCoordinates[i].st).rgb * vertexTextureCoordinates[i].p;
        p += vertexTextureCoordinates[i].p;
    }
    fragmentColor.rgb /= p;
    fragmentColor.rgb *= light.ambient + light.directional.color * max(dot(normalize(vertexNormal),
            normalize(-light.directional.direction)), 0.0);
}
