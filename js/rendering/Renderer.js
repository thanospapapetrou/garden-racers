'use strict';

class Renderer {
    static #DELIMITER = '.';
    static #TYPE_FUNCTION = 'function';

    #gl;
    #program;
    #uniforms;
    #attributes;

    constructor(gl, vertex, fragment, uniforms, attributes) {
        this.#gl = gl;
        return (async () => {
            const vert = await new Shader(gl, gl.VERTEX_SHADER, vertex);
            const frag = await new Shader(gl, gl.FRAGMENT_SHADER, fragment);
            const program = new Program(gl, vert, frag, Object.keys(uniforms), attributes);
            this.#program = program.program;
            this.#uniforms = this.#resolveUniforms('', uniforms);
            this.#attributes = program.attributes;
            return this;
        })();
    }

    get program() {
        return this.#program;
    }

    get uniforms() {
        return this.#uniforms;
    }

    get attributes() {
        return this.#attributes;
    }

    #resolveUniforms(prefix, uniforms) {
        const result = {};
        const gl = this.#gl;
        const program = this.#program;
        for (let uniform of Object.keys(uniforms)) {
            const setter = uniforms[uniform];
            if (typeof setter == Renderer.#TYPE_FUNCTION) {
                const location = this.#gl.getUniformLocation(this.#program, prefix + uniform);
                Object.defineProperty(result, uniform, {
                    set(value) {
                        gl.useProgram(program);
                        setter(gl, location, value);
                    }
                });
            } else {
                result[uniform] = this.#resolveUniforms(prefix + uniform + Renderer.#DELIMITER, setter);
            }
        }
        return result;
    }
}
